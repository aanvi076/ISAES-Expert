import json
import redis
from typing import List, Dict
from app.core.config import settings

# In-memory fallback if redis is inaccessible during Phase 4 local testing
_fallback_memory = {}

def get_redis_client():
    try:
        client = redis.StrictRedis.from_url(settings.REDIS_URL, decode_responses=True)
        client.ping()
        return client
    except Exception:
        return None

def fetch_history(session_id: str) -> List[Dict]:
    """ Fetch chat message history for an active session. """
    r = get_redis_client()
    if r:
        raw_data = r.get(f"chat_session:{session_id}")
        if raw_data:
            return json.loads(raw_data)
        return []
    # Fallback
    return _fallback_memory.get(session_id, [])

def append_to_history(session_id: str, role: str, content: str):
    """ Adds a message to the conversation history with a 24h TTL """
    history = fetch_history(session_id)
    history.append({"role": role, "content": content})
    
    r = get_redis_client()
    if r:
        r.setex(f"chat_session:{session_id}", 86400, json.dumps(history))
    else:
        _fallback_memory[session_id] = history
