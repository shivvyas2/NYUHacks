"""
Vercel Serverless Function Entry Point
Wraps FastAPI app for Vercel serverless deployment
"""
import sys
import os

# Add backend directory to Python path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Import the FastAPI app
from src.main import app

# Use Mangum to wrap FastAPI for serverless
try:
    from mangum import Mangum
    handler = Mangum(app, lifespan="off")
except ImportError:
    # Fallback if mangum is not installed
    def handler(event, context):
        return {
            "statusCode": 500,
            "body": "Mangum adapter not installed. Please add 'mangum' to requirements.txt"
        }

