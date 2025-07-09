from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from src.models.user import db

class Template(db.Model):
    __tablename__ = 'templates'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(100), default='general')
    tags = db.Column(db.Text)  # JSON string of tags
    variables = db.Column(db.Text)  # JSON string of variable definitions
    is_favorite = db.Column(db.Boolean, default=False)
    usage_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship with user
    user = db.relationship('User', backref=db.backref('templates', lazy=True))
    
    def __repr__(self):
        return f'<Template {self.id}: {self.name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'content': self.content,
            'category': self.category,
            'tags': self.tags,
            'variables': self.variables,
            'is_favorite': self.is_favorite,
            'usage_count': self.usage_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

