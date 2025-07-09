from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from src.models.user import db

class ClipboardItem(db.Model):
    __tablename__ = 'clipboard_items'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    content_type = db.Column(db.String(50), nullable=False)  # text, image, link, file
    title = db.Column(db.String(200))
    is_pinned = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship with user
    user = db.relationship('User', backref=db.backref('clipboard_items', lazy=True))
    
    def __repr__(self):
        return f'<ClipboardItem {self.id}: {self.title or self.content[:50]}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'content': self.content,
            'content_type': self.content_type,
            'title': self.title,
            'is_pinned': self.is_pinned,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

