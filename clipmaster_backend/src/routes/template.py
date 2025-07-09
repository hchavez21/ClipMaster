from flask import Blueprint, request, jsonify
from src.models.user import db
from src.models.template import Template
from datetime import datetime
import json
import re

template_bp = Blueprint('template', __name__)

@template_bp.route('/templates', methods=['GET'])
def get_templates():
    """Get all templates for a user with optional filtering"""
    try:
        # For demo purposes, using user_id = 1. In production, get from auth token
        user_id = request.args.get('user_id', 1, type=int)
        category = request.args.get('category')
        search = request.args.get('search')
        favorites_only = request.args.get('favorites', type=bool)
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        query = Template.query.filter_by(user_id=user_id)
        
        # Apply filters
        if category:
            query = query.filter_by(category=category)
        
        if search:
            query = query.filter(
                Template.name.contains(search) |
                Template.content.contains(search) |
                Template.tags.contains(search)
            )
        
        if favorites_only:
            query = query.filter_by(is_favorite=True)
        
        # Order by favorites first, then by usage count desc, then by updated_at desc
        query = query.order_by(
            Template.is_favorite.desc(),
            Template.usage_count.desc(),
            Template.updated_at.desc()
        )
        
        # Paginate
        templates = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'templates': [template.to_dict() for template in templates.items],
            'total': templates.total,
            'pages': templates.pages,
            'current_page': page,
            'per_page': per_page
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@template_bp.route('/templates', methods=['POST'])
def create_template():
    """Create a new template"""
    try:
        data = request.get_json()
        
        if not data or 'name' not in data or 'content' not in data:
            return jsonify({'error': 'Name and content are required'}), 400
        
        # For demo purposes, using user_id = 1. In production, get from auth token
        user_id = data.get('user_id', 1)
        
        # Extract variables from template content
        variables = extract_variables(data['content'])
        
        template = Template(
            user_id=user_id,
            name=data['name'],
            content=data['content'],
            category=data.get('category', 'general'),
            tags=json.dumps(data.get('tags', [])),
            variables=json.dumps(variables),
            is_favorite=data.get('is_favorite', False)
        )
        
        db.session.add(template)
        db.session.commit()
        
        return jsonify(template.to_dict()), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@template_bp.route('/templates/<int:template_id>', methods=['PUT'])
def update_template(template_id):
    """Update a template"""
    try:
        template = Template.query.get_or_404(template_id)
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Update fields if provided
        if 'name' in data:
            template.name = data['name']
        if 'content' in data:
            template.content = data['content']
            # Re-extract variables when content changes
            template.variables = json.dumps(extract_variables(data['content']))
        if 'category' in data:
            template.category = data['category']
        if 'tags' in data:
            template.tags = json.dumps(data['tags'])
        if 'is_favorite' in data:
            template.is_favorite = data['is_favorite']
        
        template.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify(template.to_dict())
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@template_bp.route('/templates/<int:template_id>', methods=['DELETE'])
def delete_template(template_id):
    """Delete a template"""
    try:
        template = Template.query.get_or_404(template_id)
        db.session.delete(template)
        db.session.commit()
        
        return jsonify({'message': 'Template deleted successfully'})
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@template_bp.route('/templates/<int:template_id>/use', methods=['POST'])
def use_template(template_id):
    """Use a template by replacing variables with provided values"""
    try:
        template = Template.query.get_or_404(template_id)
        data = request.get_json()
        
        variables = data.get('variables', {}) if data else {}
        
        # Replace variables in template content
        content = template.content
        for var_name, var_value in variables.items():
            content = content.replace(f'{{{{{var_name}}}}}', str(var_value))
        
        # Process conditional logic (basic if/else)
        content = process_conditional_logic(content, variables)
        
        # Increment usage count
        template.usage_count += 1
        db.session.commit()
        
        return jsonify({
            'content': content,
            'template_id': template_id,
            'template_name': template.name
        })
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@template_bp.route('/templates/<int:template_id>/favorite', methods=['POST'])
def toggle_favorite_template(template_id):
    """Toggle favorite status of a template"""
    try:
        template = Template.query.get_or_404(template_id)
        template.is_favorite = not template.is_favorite
        template.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify(template.to_dict())
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@template_bp.route('/templates/categories', methods=['GET'])
def get_template_categories():
    """Get all template categories for a user"""
    try:
        # For demo purposes, using user_id = 1. In production, get from auth token
        user_id = request.args.get('user_id', 1, type=int)
        
        categories = db.session.query(Template.category).filter_by(user_id=user_id).distinct().all()
        category_list = [cat[0] for cat in categories if cat[0]]
        
        return jsonify({'categories': category_list})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@template_bp.route('/templates/stats', methods=['GET'])
def get_template_stats():
    """Get template statistics for a user"""
    try:
        # For demo purposes, using user_id = 1. In production, get from auth token
        user_id = request.args.get('user_id', 1, type=int)
        
        total_templates = Template.query.filter_by(user_id=user_id).count()
        favorite_templates = Template.query.filter_by(user_id=user_id, is_favorite=True).count()
        
        # Count by category
        category_counts = db.session.query(
            Template.category,
            db.func.count(Template.id)
        ).filter_by(user_id=user_id).group_by(Template.category).all()
        
        # Most used templates
        most_used = Template.query.filter_by(user_id=user_id).order_by(
            Template.usage_count.desc()
        ).limit(5).all()
        
        return jsonify({
            'total_templates': total_templates,
            'favorite_templates': favorite_templates,
            'category_counts': {category: count for category, count in category_counts},
            'most_used': [template.to_dict() for template in most_used]
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def extract_variables(content):
    """Extract variable names from template content"""
    # Find all {{variable}} patterns
    pattern = r'\{\{([^}]+)\}\}'
    matches = re.findall(pattern, content)
    
    # Filter out conditional logic keywords
    variables = []
    for match in matches:
        match = match.strip()
        if not match.startswith('#') and not match.startswith('/') and match != 'else':
            variables.append(match)
    
    return list(set(variables))  # Remove duplicates

def process_conditional_logic(content, variables):
    """Process basic conditional logic in templates"""
    # Simple if/else processing
    # Pattern: {{#if variable}}content{{else}}alternative{{/if}}
    if_pattern = r'\{\{#if\s+(\w+)\}\}(.*?)\{\{else\}\}(.*?)\{\{/if\}\}'
    
    def replace_conditional(match):
        var_name = match.group(1)
        if_content = match.group(2)
        else_content = match.group(3)
        
        # Check if variable exists and is truthy
        if var_name in variables and variables[var_name]:
            return if_content
        else:
            return else_content
    
    content = re.sub(if_pattern, replace_conditional, content, flags=re.DOTALL)
    
    # Simple if without else
    # Pattern: {{#if variable}}content{{/if}}
    if_only_pattern = r'\{\{#if\s+(\w+)\}\}(.*?)\{\{/if\}\}'
    
    def replace_if_only(match):
        var_name = match.group(1)
        if_content = match.group(2)
        
        # Check if variable exists and is truthy
        if var_name in variables and variables[var_name]:
            return if_content
        else:
            return ''
    
    content = re.sub(if_only_pattern, replace_if_only, content, flags=re.DOTALL)
    
    return content

