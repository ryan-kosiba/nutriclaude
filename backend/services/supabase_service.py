from __future__ import annotations

import os
from typing import Any, Dict, List, Optional

from supabase import create_client, Client

_client: Optional[Client] = None


def get_client() -> Client:
    global _client
    if _client is None:
        _client = create_client(
            os.getenv("SUPABASE_URL", ""),
            os.getenv("SUPABASE_SERVICE_ROLE_KEY", ""),
        )
    return _client


# --- Pending Logs ---

def create_pending_log(user_id: str, telegram_chat_id: str, log_type: str, payload: dict) -> dict:
    """Insert a new pending log and return the created record."""
    client = get_client()
    result = client.table("pending_logs").insert({
        "user_id": user_id,
        "telegram_chat_id": telegram_chat_id,
        "type": log_type,
        "payload": payload,
    }).execute()
    return result.data[0]


def get_pending_log(pending_id: str) -> Optional[dict]:
    """Fetch a pending log by ID."""
    client = get_client()
    result = client.table("pending_logs").select("*").eq("id", pending_id).execute()
    return result.data[0] if result.data else None


def delete_pending_log(pending_id: str) -> None:
    """Delete a pending log by ID."""
    client = get_client()
    client.table("pending_logs").delete().eq("id", pending_id).execute()


def confirm_log(pending_id: str) -> Optional[dict]:
    """Move a pending log to the appropriate table and delete the pending entry.

    Returns the inserted record, or None if the pending log was not found.
    """
    pending = get_pending_log(pending_id)
    if pending is None:
        return None

    log_type = pending["type"]
    payload = pending["payload"]
    user_id = pending["user_id"]

    # Add user_id to the payload for the final table
    payload["user_id"] = user_id

    table_map = {
        "meal": "meals",
        "workout": "workouts",
        "bodyweight": "bodyweight",
        "wellness": "wellness",
        "workout_quality": "workout_quality",
    }

    table = table_map.get(log_type)
    if table is None:
        delete_pending_log(pending_id)
        return None

    # Remove the "type" field since it's not a column in the final tables
    payload.pop("type", None)

    client = get_client()
    result = client.table(table).insert(payload).execute()
    delete_pending_log(pending_id)
    return result.data[0]


# --- Direct Inserts ---

def insert_meal(user_id: str, data: dict) -> dict:
    client = get_client()
    data["user_id"] = user_id
    result = client.table("meals").insert(data).execute()
    return result.data[0]


def insert_workout(user_id: str, data: dict) -> dict:
    client = get_client()
    data["user_id"] = user_id
    result = client.table("workouts").insert(data).execute()
    return result.data[0]


def insert_bodyweight(user_id: str, data: dict) -> dict:
    client = get_client()
    data["user_id"] = user_id
    result = client.table("bodyweight").insert(data).execute()
    return result.data[0]


def insert_wellness(user_id: str, data: dict) -> dict:
    client = get_client()
    data["user_id"] = user_id
    result = client.table("wellness").insert(data).execute()
    return result.data[0]


def insert_workout_quality(user_id: str, data: dict) -> dict:
    client = get_client()
    data["user_id"] = user_id
    result = client.table("workout_quality").insert(data).execute()
    return result.data[0]
