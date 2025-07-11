from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import uuid

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    height = db.Column(db.Integer)
    weight = db.Column(db.Integer)
    goal = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionamentos
    matches_as_user_a = db.relationship('Match', foreign_keys='Match.user_a_id', backref='user_a', lazy='dynamic')
    matches_as_user_b = db.relationship('Match', foreign_keys='Match.user_b_id', backref='user_b', lazy='dynamic')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'height': self.height,
            'weight': self.weight,
            'goal': self.goal,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class WorkoutPreference(db.Model):
    __tablename__ = 'workout_preferences'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(50), unique=True, nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name
        }

class UserWorkoutPreference(db.Model):
    __tablename__ = 'user_workout_preferences'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    workout_preference_id = db.Column(db.String(36), db.ForeignKey('workout_preferences.id'), nullable=False)
    
    user = db.relationship('User', backref='workout_preferences')
    workout_preference = db.relationship('WorkoutPreference')

class Match(db.Model):
    __tablename__ = 'matches'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_a_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    user_b_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, accepted, rejected
    compatibility_score = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_a_id': self.user_a_id,
            'user_b_id': self.user_b_id,
            'status': self.status,
            'compatibility_score': self.compatibility_score,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

