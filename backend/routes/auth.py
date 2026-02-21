import jwt
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from config.settings import JWT_SECRET
from dependencies import get_current_user
from services.supabase_service import get_client

router = APIRouter(prefix="/auth")


class TokenRequest(BaseModel):
    token: str


@router.post("/verify")
async def verify_magic_link(body: TokenRequest):
    """Exchange a magic link JWT for a long-lived session JWT."""
    try:
        payload = jwt.decode(body.token, JWT_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    if payload.get("type") != "magic_link":
        raise HTTPException(status_code=401, detail="Invalid token type")

    telegram_id = payload["telegram_id"]
    display_name = payload.get("display_name", "")

    # Upsert user
    client = get_client()
    result = client.table("users").select("*").eq("telegram_id", telegram_id).execute()
    if result.data:
        user = result.data[0]
        if display_name and user.get("display_name") != display_name:
            client.table("users").update({"display_name": display_name}).eq("telegram_id", telegram_id).execute()
            user["display_name"] = display_name
    else:
        insert_result = client.table("users").insert({
            "telegram_id": telegram_id,
            "display_name": display_name,
        }).execute()
        user = insert_result.data[0]

    # Issue session JWT (7 days)
    session_payload = {
        "telegram_id": telegram_id,
        "display_name": user.get("display_name", ""),
        "type": "session",
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
    }
    session_token = jwt.encode(session_payload, JWT_SECRET, algorithm="HS256")

    return {
        "session_token": session_token,
        "user": {
            "telegram_id": telegram_id,
            "display_name": user.get("display_name", ""),
        },
    }


@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    """Return current authenticated user info."""
    return {"user": user}
