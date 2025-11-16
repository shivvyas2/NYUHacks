import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# OpenRouter API Key
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    raise ValueError(
        "⚠️  OPENROUTER_API_KEY not found!\n"
        "Add to .env: OPENROUTER_API_KEY=sk-or-v1-...\n"
        "Get key at: https://openrouter.ai/keys"
    )

# Supabase configuration - REQUIRED
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise ValueError(
        "⚠️  Supabase credentials not found!\n"
        "Add to .env:\n"
        "SUPABASE_URL=https://xxxxx.supabase.co\n"
        "SUPABASE_SERVICE_KEY=eyJhbGc... (service_role key from Supabase Settings → API)"
    )

