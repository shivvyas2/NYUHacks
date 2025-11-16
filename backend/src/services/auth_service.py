"""
Authentication service - handles Supabase authentication
"""

from supabase import Client
from src.utils.database import Database
from src.models.schemas import UserSignup, UserLogin
from typing import Optional, Dict

class AuthService:
    def __init__(self, db: Client):
        self.db = db
    
    def _get_auth_client(self) -> Client:
        """Get a Supabase client configured for authentication"""
        # Use the same client but ensure it's configured for auth operations
        return self.db
    
    async def signup(self, user_data: UserSignup) -> Dict:
        """Sign up a new user using Supabase Auth"""
        try:
            # Use Supabase auth.sign_up() which handles user creation
            response = self.db.auth.sign_up({
                "email": user_data.email,
                "password": user_data.password,
            })
            
            if response.user:
                return {
                    "success": True,
                    "user": {
                        "id": response.user.id,
                        "email": response.user.email,
                    },
                    "message": "User created successfully. Please check your email to verify your account."
                }
            else:
                return {
                    "success": False,
                    "error": "Failed to create user"
                }
        except Exception as e:
            error_msg = str(e)
            # Extract more user-friendly error messages
            if "User already registered" in error_msg or "already exists" in error_msg.lower():
                error_msg = "An account with this email already exists"
            return {
                "success": False,
                "error": error_msg
            }
    
    async def login(self, user_data: UserLogin) -> Dict:
        """Login user using Supabase Auth"""
        try:
            # Use Supabase auth.sign_in_with_password() which returns a session
            response = self.db.auth.sign_in_with_password({
                "email": user_data.email,
                "password": user_data.password,
            })
            
            if response.user and response.session:
                return {
                    "success": True,
                    "access_token": response.session.access_token,
                    "refresh_token": response.session.refresh_token,
                    "user": {
                        "id": response.user.id,
                        "email": response.user.email,
                    }
                }
            else:
                return {
                    "success": False,
                    "error": "Invalid credentials"
                }
        except Exception as e:
            error_msg = str(e)
            # Provide user-friendly error messages
            if "Invalid login credentials" in error_msg or "invalid" in error_msg.lower():
                error_msg = "Invalid email or password"
            return {
                "success": False,
                "error": error_msg
            }
    
    async def get_user(self, token: str) -> Optional[Dict]:
        """Get user from Supabase JWT token"""
        try:
            # Use the existing database client to verify the token
            # Supabase tokens are JWTs that can be verified
            response = self.db.auth.get_user(token)
            
            if response.user:
                return {
                    "id": response.user.id,
                    "email": response.user.email,
                }
            return None
        except Exception as e:
            # Token might be invalid or expired
            print(f"Error verifying token: {e}")
            return None
    
    async def logout(self, token: str) -> Dict:
        """Logout user - invalidate session in Supabase"""
        try:
            # Set the session with the token before signing out
            # This ensures Supabase knows which session to invalidate
            try:
                # Try to get user first to validate token
                user_response = self.db.auth.get_user(token)
                if user_response.user:
                    # Sign out the user
                    self.db.auth.sign_out()
                    return {
                        "success": True,
                        "message": "Logged out successfully"
                    }
                else:
                    return {
                        "success": False,
                        "error": "Invalid token"
                    }
            except Exception as e:
                # Token might already be invalid, but we'll still return success
                # as the user is effectively logged out
                return {
                    "success": True,
                    "message": "Logged out successfully"
                }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

