from flask import Blueprint, jsonify
from src.models.workout_partner import db, WorkoutPreference

workout_preferences_bp = Blueprint('workout_preferences', __name__)

@workout_preferences_bp.route('/workout-preferences', methods=['GET'])
def get_workout_preferences():
    try:
        preferences = WorkoutPreference.query.all()
        return jsonify([pref.to_dict() for pref in preferences]), 200
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

def seed_workout_preferences():
    """Função para popular as preferências de treino"""
    preferences = [
        'Peito', 'Costas', 'Ombro', 'Braço', 'Abdômen', 
        'Cardio', 'Funcional', 'Crossfit', 'Yoga', 'Pilates', 'Natação'
    ]
    
    for pref_name in preferences:
        existing = WorkoutPreference.query.filter_by(name=pref_name).first()
        if not existing:
            pref = WorkoutPreference(name=pref_name)
            db.session.add(pref)
    
    try:
        db.session.commit()
        print("Preferências de treino populadas com sucesso!")
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao popular preferências: {e}")

