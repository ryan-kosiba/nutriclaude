from datetime import date

from fastapi import APIRouter, Query

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
async def get_kpis(range: str = Query("7d", pattern=r"^\d+d$")):
    return compute_kpis(range)


@router.get("/meals")
async def get_meals(range: str = Query("7d", pattern=r"^\d+d$")):
    return compute_daily_meals(range)


@router.get("/weight")
async def get_weight(range: str = Query("30d", pattern=r"^\d+d$")):
    data = fetch_bodyweight(range)
    return [
        {"date": row["timestamp"][:10], "weight_lbs": row["weight_lbs"]}
        for row in data
    ]


@router.get("/wellness")
async def get_wellness(range: str = Query("7d", pattern=r"^\d+d$")):
    data = fetch_wellness(range)
    return [
        {"date": row["timestamp"][:10], "fatigue_score": row["fatigue_score"]}
        for row in data
    ]


@router.get("/workouts")
async def get_workouts(range: str = Query("7d", pattern=r"^\d+d$")):
    data = fetch_workouts(range)
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
async def get_summary():
    text = await generate_summary()
    return {"summary": text}


@router.get("/daily")
async def get_daily(date: str = Query(default="", pattern=r"^\d{4}-\d{2}-\d{2}$")):
    if not date:
        date = __import__("datetime").date.today().isoformat()
    return fetch_daily(date)


@router.get("/dates")
async def get_dates(range: str = Query("7d", pattern=r"^\d+d$")):
    return get_logged_dates(range)


@router.get("/calorie-balance")
async def get_calorie_balance(range: str = Query("7d", pattern=r"^\d+d$")):
    return compute_calorie_balance(range)
