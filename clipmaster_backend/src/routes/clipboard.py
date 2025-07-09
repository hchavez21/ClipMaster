from flask import Blueprint, request, jsonify
from src.models.user import db
from src.models.clipboard import ClipboardItem
from datetime import datetime
import json

clipboard_bp = Blueprint('clipboard', __name__)

@clipboard_bp.route('/clipboard', methods=['GET'])
def get_clipboard_items():
    """Get all clipboard items for a user with optional filtering"""
    try:
        # For demo purposes, using user_id = 1. In production, get from auth token
        user_id = request.args.get('user_id', 1, type=int)
        content_type = request.args.get('type')
        search = request.args.get('search')
        pinned_only = request.args.get('pinned', type=bool)
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        query = ClipboardItem.query.filter_by(user_id=user_id)
        
        # Apply filters
        if content_type:
            query = query.filter_by(content_type=content_type)
        
        if search:
            query = query.filter(
                ClipboardItem.content.contains(search) |
                ClipboardItem.title.contains(search)
            )
        
        if pinned_only:
            query = query.filter_by(is_pinned=True)
        
        # Order by pinned first, then by created_at desc
        query = query.order_by(ClipboardItem.is_pinned.desc(), ClipboardItem.created_at.desc())
        
        # Paginate
        items = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'items': [item.to_dict() for item in items.items],
            'total': items.total,
            'pages': items.pages,
            'current_page': page,
            'per_page': per_page
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@clipboard_bp.route('/clipboard', methods=['POST'])
def create_clipboard_item():
    """Create a new clipboard item"""
    try:
        data = request.get_json()
        
        if not data or 'content' not in data:
            return jsonify({'error': 'Content is required'}), 400
        
        # For demo purposes, using user_id = 1. In production, get from auth token
        user_id = data.get('user_id', 1)
        
        item = ClipboardItem(
            user_id=user_id,
            content=data['content'],
            content_type=data.get('content_type', 'text'),
            title=data.get('title'),
            is_pinned=data.get('is_pinned', False)
        )
        
        db.session.add(item)
        db.session.commit()
        
        return jsonify(item.to_dict()), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@clipboard_bp.route('/clipboard/<int:item_id>', methods=['PUT'])
def update_clipboard_item(item_id):
    """Update a clipboard item"""
    try:
        item = ClipboardItem.query.get_or_404(item_id)
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Update fields if provided
        if 'content' in data:
            item.content = data['content']
        if 'content_type' in data:
            item.content_type = data['content_type']
        if 'title' in data:
            item.title = data['title']
        if 'is_pinned' in data:
            item.is_pinned = data['is_pinned']
        
        item.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify(item.to_dict())
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@clipboard_bp.route('/clipboard/<int:item_id>', methods=['DELETE'])
def delete_clipboard_item(item_id):
    """Delete a clipboard item"""
    try:
        item = ClipboardItem.query.get_or_404(item_id)
        db.session.delete(item)
        db.session.commit()
        
        return jsonify({'message': 'Item deleted successfully'})
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@clipboard_bp.route('/clipboard/<int:item_id>/pin', methods=['POST'])
def toggle_pin_clipboard_item(item_id):
    """Toggle pin status of a clipboard item"""
    try:
        item = ClipboardItem.query.get_or_404(item_id)
        item.is_pinned = not item.is_pinned
        item.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify(item.to_dict())
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@clipboard_bp.route('/clipboard/stats', methods=['GET'])
def get_clipboard_stats():
    """Get clipboard statistics for a user"""
    try:
        # For demo purposes, using user_id = 1. In production, get from auth token
        user_id = request.args.get('user_id', 1, type=int)
        
        total_items = ClipboardItem.query.filter_by(user_id=user_id).count()
        pinned_items = ClipboardItem.query.filter_by(user_id=user_id, is_pinned=True).count()
        
        # Count by content type
        type_counts = db.session.query(
            ClipboardItem.content_type,
            db.func.count(ClipboardItem.id)
        ).filter_by(user_id=user_id).group_by(ClipboardItem.content_type).all()
        
        return jsonify({
            'total_items': total_items,
            'pinned_items': pinned_items,
            'type_counts': {content_type: count for content_type, count in type_counts}
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

