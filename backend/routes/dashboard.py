import datetime as dt

from fastapi import APIRouter, Depends, Query

from dependencies import get_current_user
from services.aggregation_service import (
    compute_kpis,
    compute_daily_meals,
    compute_calorie_balance,
    fetch_bodyweight,
    fetch_wellness,
    fetch_workouts,
    fetch_daily,
    get_logged_dates,
    generate_summary,
)

router = APIRouter()


@router.get("/kpis")
async def get_kpis(range: str = Query("7d", pattern=r"^\d+d$"), user: dict = Depends(get_current_user)):
    return compute_kpis(user["telegram_id"], range)


@router.get("/meals")
async def get_meals(range: str = Query("7d", pattern=r"^\d+d$"), user: dict = Depends(get_current_user)):
    return compute_daily_meals(user["telegram_id"], range)


@router.get("/weight")
async def get_weight(range: str = Query("30d", pattern=r"^\d+d$"), user: dict = Depends(get_current_user)):
    data = fetch_bodyweight(user["telegram_id"], range)
    return [
        {"date": row["timestamp"][:10], "weight_lbs": row["weight_lbs"]}
        for row in data
    ]


@router.get("/wellness")
async def get_wellness(range: str = Query("7d", pattern=r"^\d+d$"), user: dict = Depends(get_current_user)):
    data = fetch_wellness(user["telegram_id"], range)
    return [
        {"date": row["timestamp"][:10], "fatigue_score": row["fatigue_score"]}
        for row in data
    ]


@router.get("/workouts")
async def get_workouts(range: str = Query("7d", pattern=r"^\d+d$"), user: dict = Depends(get_current_user)):
    data = fetch_workouts(user["telegram_id"], range)
    return [
        {
            "date": row["timestamp"][:10],
            "description": row.get("description", ""),
            "calories_burned": row.get("estimated_calories_burned", 0),
            "intensity": row.get("intensity_score"),
        }
        for row in data
    ]


@router.get("/summary")
async def get_summary(user: dict = Depends(get_current_user)):
    text = await generate_summary(user["telegram_id"])
    return {"summary": text}


@router.get("/daily")
async def get_daily(date: str = Query(default="", pattern=r"^\d{4}-\d{2}-\d{2}$"), user: dict = Depends(get_current_user)):
    if not date:
        date = dt.date.today().isoformat()
    return fetch_daily(user["telegram_id"], date)


@router.get("/dates")
async def get_dates(range: str = Query("7d", pattern=r"^\d+d$"), user: dict = Depends(get_current_user)):
    return get_logged_dates(user["telegram_id"], range)


@router.get("/calorie-balance")
async def get_calorie_balance(range: str = Query("7d", pattern=r"^\d+d$"), user: dict = Depends(get_current_user)):
    return compute_calorie_balance(user["telegram_id"], range)
