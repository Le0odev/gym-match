from flask import Blueprint, request, jsonify
from src.models.workout_partner import db, User, Match, UserWorkoutPreference
from src.routes.auth import verify_token
import random

matches_bp = Blueprint('matches', __name__)

def get_current_user_from_token():
    """Helper function to get current user from token"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header.split(' ')[1]
    user_id = verify_token(token)
    
    if not user_id:
        return None
    
    return User.query.get(user_id)

def calculate_compatibility_score(user_a, user_b):
    """Calculate compatibility score between two users"""
    score = 50  # Base score
    
    # Height compatibility (10 points max)
    if user_a.height and user_b.height:
        height_diff = abs(user_a.height - user_b.height)
        if height_diff <= 10:
            score += 10
        elif height_diff <= 20:
            score += 5
    
    # Weight compatibility (10 points max)
    if user_a.weight and user_b.weight:
        weight_diff = abs(user_a.weight - user_b.weight)
        if weight_diff <= 10:
            score += 10
        elif weight_diff <= 20:
            score += 5
    
    # Goal similarity (30 points max)
    if user_a.goal and user_b.goal:
        if user_a.goal.lower() in user_b.goal.lower() or user_b.goal.lower() in user_a.goal.lower():
            score += 30
        elif any(word in user_b.goal.lower() for word in user_a.goal.lower().split()):
            score += 15
    
    return min(score, 100)

@matches_bp.route('/matches/discover', methods=['GET'])
def discover_users():
    try:
        current_user = get_current_user_from_token()
        if not current_user:
            return jsonify({'error': 'Token inválido'}), 401
        
        # Get users excluding current user and already matched/skipped users
        existing_matches = db.session.query(Match.user_a_id, Match.user_b_id).filter(
            (Match.user_a_id == current_user.id) | (Match.user_b_id == current_user.id)
        ).all()
        
        excluded_user_ids = set([current_user.id])
        for match in existing_matches:
            excluded_user_ids.add(match.user_a_id if match.user_a_id != current_user.id else match.user_b_id)
        
        users = User.query.filter(~User.id.in_(excluded_user_ids)).limit(10).all()
        
        # Calculate compatibility scores
        users_with_compatibility = []
        for user in users:
            compatibility_score = calculate_compatibility_score(current_user, user)
            user_dict = user.to_dict()
            user_dict['compatibilityScore'] = compatibility_score
            users_with_compatibility.append(user_dict)
        
        # Sort by compatibility score
        users_with_compatibility.sort(key=lambda x: x['compatibilityScore'], reverse=True)
        
        return jsonify(users_with_compatibility), 200
        
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@matches_bp.route('/matches/like/<user_id>', methods=['POST'])
def like_user(user_id):
    try:
        current_user = get_current_user_from_token()
        if not current_user:
            return jsonify({'error': 'Token inválido'}), 401
        
        # Check if the other user already liked current user
        existing_match = Match.query.filter_by(
            user_a_id=user_id,
            user_b_id=current_user.id,
            status='pending'
        ).first()
        
        if existing_match:
            # It's a match!
            existing_match.status = 'accepted'
            db.session.commit()
            return jsonify({
                'matchStatus': 'accepted',
                'matchId': existing_match.id
            }), 200
        else:
            # Create new pending match
            target_user = User.query.get(user_id)
            if not target_user:
                return jsonify({'error': 'Usuário não encontrado'}), 404
            
            compatibility_score = calculate_compatibility_score(current_user, target_user)
            
            new_match = Match(
                user_a_id=current_user.id,
                user_b_id=user_id,
                status='pending',
                compatibility_score=compatibility_score
            )
            
            db.session.add(new_match)
            db.session.commit()
            
            return jsonify({
                'matchStatus': 'pending',
                'matchId': new_match.id
            }), 200
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Erro interno do servidor'}), 500

@matches_bp.route('/matches/skip/<user_id>', methods=['POST'])
def skip_user(user_id):
    try:
        current_user = get_current_user_from_token()
        if not current_user:
            return jsonify({'error': 'Token inválido'}), 401
        
        # Create rejected match to prevent showing this user again
        skip_match = Match(
            user_a_id=current_user.id,
            user_b_id=user_id,
            status='rejected'
        )
        
        db.session.add(skip_match)
        db.session.commit()
        
        return jsonify({'status': 'ok'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Erro interno do servidor'}), 500

@matches_bp.route('/matches', methods=['GET'])
def get_user_matches():
    try:
        current_user = get_current_user_from_token()
        if not current_user:
            return jsonify({'error': 'Token inválido'}), 401
        
        matches = Match.query.filter(
            ((Match.user_a_id == current_user.id) | (Match.user_b_id == current_user.id)) &
            (Match.status == 'accepted')
        ).all()
        
        result = []
        for match in matches:
            other_user_id = match.user_b_id if match.user_a_id == current_user.id else match.user_a_id
            other_user = User.query.get(other_user_id)
            
            if other_user:
                result.append({
                    'matchId': match.id,
                    'user': other_user.to_dict(),
                    'status': match.status,
                    'compatibilityScore': match.compatibility_score,
                    'createdAt': match.created_at.isoformat() if match.created_at else None
                })
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

