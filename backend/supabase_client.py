"""
Supabase client for AI agent integration
Provides high-level operations for the learning agent
"""

from supabase import create_client, Client
from typing import List, Dict, Optional
from datetime import datetime
from config import SUPABASE_URL, SUPABASE_SERVICE_KEY

# Initialize Supabase client
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    print("✅ Supabase client initialized")
except Exception as e:
    print(f"❌ Supabase init failed: {e}")
    raise

class SupabaseAgentOps:
    """Supabase operations for the AI learning agent"""
    
    @staticmethod
    def get_user_performance(user_id: str) -> Dict:
        """Get user performance stats from Supabase"""
        try:
            # Get user stats
            stats_response = supabase.table('user_stats').select('*').eq('user_id', user_id).execute()
            
            if stats_response.data and len(stats_response.data) > 0:
                stats = stats_response.data[0]
                return {
                    "total_attempts": stats.get('total_questions_answered', 0),
                    "correct_answers": stats.get('total_correct', 0),
                    "wrong_answers": stats.get('total_wrong', 0),
                    "accuracy": float(stats.get('overall_accuracy', 0)) * 100,
                    "weak_topics": stats.get('weak_topics', []),
                    "strong_topics": stats.get('strong_topics', []),
                }
            
            return {"total_attempts": 0, "weak_topics": [], "strong_topics": []}
            
        except Exception as e:
            print(f"Error fetching user performance: {e}")
            return {"total_attempts": 0, "weak_topics": [], "strong_topics": []}
    
    @staticmethod
    def get_topic_performance(user_id: str) -> Dict[str, Dict]:
        """Get performance breakdown by topic"""
        try:
            # Get all question attempts for user
            response = supabase.table('question_attempts').select(
                'topic, is_correct, time_spent'
            ).eq('user_id', user_id).execute()
            
            if not response.data:
                return {}
            
            # Aggregate by topic
            topic_stats = {}
            for attempt in response.data:
                topic = attempt['topic']
                if topic not in topic_stats:
                    topic_stats[topic] = {
                        'total': 0,
                        'correct': 0,
                        'total_time': 0
                    }
                
                topic_stats[topic]['total'] += 1
                if attempt['is_correct']:
                    topic_stats[topic]['correct'] += 1
                topic_stats[topic]['total_time'] += attempt.get('time_spent', 0)
            
            # Calculate percentages
            for topic in topic_stats:
                stats = topic_stats[topic]
                stats['accuracy'] = (stats['correct'] / stats['total'] * 100) if stats['total'] > 0 else 0
                stats['avg_time'] = stats['total_time'] / stats['total'] if stats['total'] > 0 else 0
                stats['attempts'] = stats['total']
            
            return topic_stats
            
        except Exception as e:
            print(f"Error fetching topic performance: {e}")
            return {}
    
    @staticmethod
    def save_game_session(user_id: str, game_data: Dict) -> Optional[str]:
        """Save a game session to Supabase"""
        try:
            session_data = {
                'user_id': user_id,
                'game_id': game_data['game_type'],
                'score': game_data['score'],
                'accuracy': game_data['accuracy'] / 100.0,  # Convert to decimal
                'correct_answers': game_data['correct_answers'],
                'wrong_answers': game_data['wrong_answers'],
                'max_streak': game_data['max_streak'],
                'average_response_time': game_data.get('avg_response_time', 0),
            }
            
            response = supabase.table('game_sessions').insert(session_data).execute()
            
            if response.data and len(response.data) > 0:
                return response.data[0]['id']
            
            return None
            
        except Exception as e:
            print(f"Error saving game session: {e}")
            return None
    
    @staticmethod
    def save_question_attempts(session_id: str, user_id: str, attempts: List[Dict]) -> bool:
        """Save question attempts to Supabase"""
        if not session_id:
            return False
        
        try:
            attempt_data = []
            for attempt in attempts:
                attempt_data.append({
                    'session_id': session_id,
                    'question_id': attempt.get('question_id', 0),
                    'topic': attempt.get('topic', 'Unknown'),
                    'difficulty': attempt.get('difficulty', 'medium'),
                    'is_correct': attempt.get('is_correct', False),
                    'time_spent': attempt.get('time_spent', 0),
                })
            
            if attempt_data:
                supabase.table('question_attempts').insert(attempt_data).execute()
                return True
            
            return False
            
        except Exception as e:
            print(f"Error saving question attempts: {e}")
            return False
    
    @staticmethod
    def update_user_stats(user_id: str, game_data: Dict) -> bool:
        """Update user statistics in Supabase"""
        try:
            # Get current stats
            response = supabase.table('user_stats').select('*').eq('user_id', user_id).execute()
            
            if response.data and len(response.data) > 0:
                # Update existing stats
                current = response.data[0]
                
                new_total_games = current['total_games_played'] + 1
                new_total_score = current['total_score'] + game_data['score']
                new_total_questions = current['total_questions_answered'] + game_data['correct_answers'] + game_data['wrong_answers']
                new_total_correct = current['total_correct'] + game_data['correct_answers']
                new_total_wrong = current['total_wrong'] + game_data['wrong_answers']
                new_accuracy = new_total_correct / new_total_questions if new_total_questions > 0 else 0
                
                update_data = {
                    'total_games_played': new_total_games,
                    'total_score': new_total_score,
                    'total_questions_answered': new_total_questions,
                    'total_correct': new_total_correct,
                    'total_wrong': new_total_wrong,
                    'overall_accuracy': new_accuracy,
                    'updated_at': datetime.utcnow().isoformat(),
                }
                
                supabase.table('user_stats').update(update_data).eq('user_id', user_id).execute()
            else:
                # Create new stats
                accuracy = game_data['correct_answers'] / (game_data['correct_answers'] + game_data['wrong_answers']) if (game_data['correct_answers'] + game_data['wrong_answers']) > 0 else 0
                
                insert_data = {
                    'user_id': user_id,
                    'total_games_played': 1,
                    'total_score': game_data['score'],
                    'total_questions_answered': game_data['correct_answers'] + game_data['wrong_answers'],
                    'total_correct': game_data['correct_answers'],
                    'total_wrong': game_data['wrong_answers'],
                    'overall_accuracy': accuracy,
                }
                
                supabase.table('user_stats').insert(insert_data).execute()
            
            return True
            
        except Exception as e:
            print(f"Error updating user stats: {e}")
            return False

