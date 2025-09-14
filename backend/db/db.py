from functools import lru_cache
from typing import Optional

import os
from dotenv import load_dotenv
from supabase import Client, create_client


# Load environment variables from .env at import time
load_dotenv()


_client: Optional[Client] = None


def _create_supabase_client() -> Client:
    """
    Create a Supabase Client from environment variables.

    This mirrors db/test.py behavior, using:
    - SUPABASE_URL: The Supabase project HTTPS URL (e.g. https://<project>.supabase.co)
    - SUPABASE_KEY: The API key to use (Service Role or Anon)
    """
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")

    if not supabase_url or not supabase_key:
        missing = []
        if not supabase_url:
            missing.append("SUPABASE_URL")
        if not supabase_key:
            missing.append("SUPABASE_KEY")
        raise RuntimeError(
            "Missing required Supabase environment variables: " + ", ".join(missing)
        )

    return create_client(supabase_url, supabase_key)


@lru_cache(maxsize=1)
def get_supabase_client() -> Client:
    """
    Return a cached Supabase Client instance for reuse across requests.
    This ensures we sustain a single client instance during the app lifetime.
    """
    return _create_supabase_client()


def get_db() -> Client:
    """
    FastAPI dependency provider that returns the shared Supabase client.

    Usage example in a route:
        from fastapi import Depends
        from db.db import get_db

        @app.get("/profiles")
        def list_profiles(db: Client = Depends(get_db)):
            response = db.table("profiles").select("*").execute()
            return response.data
    """
    return get_supabase_client()
