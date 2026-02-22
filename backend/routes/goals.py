from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional

from dependencies import get_current_user
from services.supabase_service import get_client

router = APIRouter()


class GoalsUpdate(BaseModel):
    target_weight_lbs: Optional[float] = None
    daily_calories: Optional[int] = None
    daily_protein_g: Optional[int] = None
    max_carbs_g: Optional[int] = None
    max_fat_g: Optional[int] = None


@router.get("/goals")
async def get_goals(user: dict = Depends(get_current_user)):
    sb = get_client()
    result = sb.table("goals").select("*").eq("user_id", user["telegram_id"]).execute()
    if result.data:
        row = result.data[0]
        return {
            "target_weight_lbs": row.get("target_weight_lbs"),
            "daily_calories": row.get("daily_calories"),
            "daily_protein_g": row.get("daily_protein_g"),
            "max_carbs_g": row.get("max_carbs_g"),
            "max_fat_g": row.get("max_fat_g"),
        }
    return {}


@router.put("/goals")
async def update_goals(data: GoalsUpdate, user: dict = Depends(get_current_user)):
    sb = get_client()
    row = {
        "user_id": user["telegram_id"],
        "target_weight_lbs": data.target_weight_lbs,
        "daily_calories": data.daily_calories,
        "daily_protein_g": data.daily_protein_g,
        "max_carbs_g": data.max_carbs_g,
        "max_fat_g": data.max_fat_g,
    }
    sb.table("goals").upsert(row, on_conflict="user_id").execute()
    return {"status": "ok"}
