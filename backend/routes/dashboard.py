import datetime as dt

from fastapi import APIRouter, Depends, HTTPException, Query, Body

from dependencies import get_current_user
from services.aggregation_service import (
    compute_kpis,
    compute_daily_meals,
    compute_calorie_balance,
    fetch_bodyweight,
    fetch_wellness,
    fetch_workout_quality,
    fetch_workouts,
    fetch_daily,
    fetch_daily_exercises,
    get_logged_dates,
    fetch_all_logs,
    fetch_exercises,
    fetch_exercise_names,
    fetch_exercise_history,
    compute_exercise_prs,
)
from services.claude_service import summarize_workout
from services.supabase_service import get_client

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


@router.get("/performance")
async def get_performance(range: str = Query("7d", pattern=r"^\d+d$"), user: dict = Depends(get_current_user)):
    data = fetch_workout_quality(user["telegram_id"], range)
    return [
        {"date": row["timestamp"][:10], "performance_score": row["performance_score"]}
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


@router.get("/log-history")
async def get_log_history(
    range: str = Query("30d", pattern=r"^\d+d$"),
    type: str = Query("all"),
    user: dict = Depends(get_current_user),
):
    return fetch_all_logs(user["telegram_id"], range, type)


@router.get("/exercises")
async def get_exercises(range: str = Query("30d", pattern=r"^\d+d$"), user: dict = Depends(get_current_user)):
    return fetch_exercises(user["telegram_id"], range)


@router.get("/exercise-names")
async def get_exercise_names(user: dict = Depends(get_current_user)):
    return fetch_exercise_names(user["telegram_id"])


@router.get("/exercise-history")
async def get_exercise_history(
    name: str = Query(..., min_length=1),
    range: str = Query("90d", pattern=r"^\d+d$"),
    user: dict = Depends(get_current_user),
):
    data = fetch_exercise_history(user["telegram_id"], name, range)
    return [
        {
            "date": row["timestamp"][:10],
            "timestamp": row["timestamp"],
            "sets": row["sets"],
            "reps": row["reps"],
            "weight_lbs": float(row["weight_lbs"]),
            "notes": row.get("notes"),
        }
        for row in data
    ]


@router.get("/exercise-prs")
async def get_exercise_prs(user: dict = Depends(get_current_user)):
    prs = compute_exercise_prs(user["telegram_id"])
    return [
        {
            "exercise_name": row["exercise_name"],
            "weight_lbs": float(row["weight_lbs"]),
            "sets": row["sets"],
            "reps": row["reps"],
            "date": row["timestamp"][:10],
        }
        for row in prs
    ]


@router.get("/workout-summary")
async def get_workout_summary(
    date: str = Query(..., pattern=r"^\d{4}-\d{2}-\d{2}$"),
    user: dict = Depends(get_current_user),
):
    user_id = user["telegram_id"]
    workouts = (
        get_client()
        .table("workouts")
        .select("*")
        .eq("user_id", user_id)
        .gte("timestamp", f"{date}T00:00:00-05:00")
        .lte("timestamp", f"{date}T23:59:59-05:00")
        .order("timestamp")
        .execute()
    ).data
    exercises = fetch_daily_exercises(user_id, date)

    total_count = len(workouts) + len(exercises)
    if total_count == 0:
        return {"summary": None}

    # Check cache
    client = get_client()
    cached = (
        client.table("workout_summaries")
        .select("*")
        .eq("user_id", user_id)
        .eq("date", date)
        .execute()
    ).data

    if cached and cached[0]["workout_count"] == total_count:
        return {"summary": cached[0]["summary"]}

    # Generate new summary
    summary = summarize_workout(workouts, exercises)

    # Upsert
    client.table("workout_summaries").upsert(
        {
            "user_id": user_id,
            "date": date,
            "workout_count": total_count,
            "summary": summary,
        },
        on_conflict="user_id,date",
    ).execute()

    return {"summary": summary}


# ── Editable fields per log type ──────────────────────────────────
_LOG_TYPE_CONFIG: dict[str, tuple[str, set[str]]] = {
    "meal":     ("meals",     {"description", "calories", "protein_g", "carbs_g", "fat_g"}),
    "workout":  ("workouts",  {"description", "estimated_calories_burned"}),
    "exercise": ("exercises", {"exercise_name", "sets", "reps", "weight_lbs", "notes"}),
    "weight":   ("bodyweight", {"weight_lbs"}),
    "wellness": ("wellness",  {"fatigue_score"}),
}


def _verify_ownership(table: str, row_id: str, user_id: str):
    """Return the row if it belongs to the user, else raise 404."""
    row = (
        get_client()
        .table(table)
        .select("id, user_id")
        .eq("id", row_id)
        .execute()
    ).data
    if not row or str(row[0]["user_id"]) != str(user_id):
        raise HTTPException(status_code=404, detail="Entry not found")
    return row[0]


@router.put("/log/{log_type}/{log_id}")
async def update_log(
    log_type: str,
    log_id: str,
    payload: dict = Body(...),
    user: dict = Depends(get_current_user),
):
    if log_type not in _LOG_TYPE_CONFIG:
        raise HTTPException(status_code=400, detail=f"Unknown log type: {log_type}")

    table, allowed_fields = _LOG_TYPE_CONFIG[log_type]
    updates = {k: v for k, v in payload.items() if k in allowed_fields}
    if not updates:
        raise HTTPException(status_code=400, detail="No valid fields to update")

    _verify_ownership(table, log_id, user["telegram_id"])

    get_client().table(table).update(updates).eq("id", log_id).execute()
    return {"status": "ok"}


@router.delete("/log/{log_type}/{log_id}")
async def delete_log(
    log_type: str,
    log_id: str,
    user: dict = Depends(get_current_user),
):
    if log_type not in _LOG_TYPE_CONFIG:
        raise HTTPException(status_code=400, detail=f"Unknown log type: {log_type}")

    table, _ = _LOG_TYPE_CONFIG[log_type]
    _verify_ownership(table, log_id, user["telegram_id"])

    get_client().table(table).delete().eq("id", log_id).execute()
    return {"status": "ok"}
