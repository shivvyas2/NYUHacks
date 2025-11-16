"""
Health check endpoints including Supabase connection test
"""

from fastapi import APIRouter, HTTPException
from src.utils.database import Database
from supabase import Client

router = APIRouter()

@router.get("/")
async def health_check():
    """Basic health check"""
    return {
        "status": "healthy",
        "service": "NYU Hacks Arcade API"
    }

@router.get("/supabase")
async def supabase_health():
    """Check Supabase connection"""
    try:
        db: Client = Database.get_client()
        
        # Try a simple query to test connection
        result = db.table("game_sessions").select("id").limit(1).execute()
        
        return {
            "status": "healthy",
            "supabase": "connected",
            "database": "accessible"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "supabase": "disconnected",
            "error": str(e)
        }

