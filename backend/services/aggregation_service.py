from __future__ import annotations

import logging
from collections import defaultdict
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from typing import Dict, List

from services.supabase_service import get_client

logger = logging.getLogger("nutriclaude.aggregation")

EASTERN = ZoneInfo("America/New_York")


def _parse_range(range_str: str) -> datetime:
    """Convert a range string like '7d', '14d', '30d' to a start datetime."""
    days = int(range_str.rstrip("d"))
    return datetime.now(EASTERN) - timedelta(days=days)


def _date_key(ts: str) -> str:
    """Extract YYYY-MM-DD from an ISO timestamp string."""
    return ts[:10]


def fetch_meals(user_id: str, range_str: str = "7d") -> List[dict]:
    start = _parse_range(range_str).isoformat()
    client = get_client()
    result = (
        client.table("meals")
        .select("*")
        .eq("user_id", user_id)
        .gte("timestamp", start)
        .order("timestamp")
        .execute()
    )
    return result.data


def fetch_workouts(user_id: str, range_str: str = "7d") -> List[dict]:
    start = _parse_range(range_str).isoformat()
    client = get_client()
    result = (
        client.table("workouts")
        .select("*")
        .eq("user_id", user_id)
        .gte("timestamp", start)
        .order("timestamp")
        .execute()
    )
    return result.data


def fetch_bodyweight(user_id: str, range_str: str = "30d") -> List[dict]:
    start = _parse_range(range_str).isoformat()
    client = get_client()
    result = (
        client.table("bodyweight")
        .select("*")
        .eq("user_id", user_id)
        .gte("timestamp", start)
        .order("timestamp")
        .execute()
    )
    return result.data


def fetch_wellness(user_id: str, range_str: str = "7d") -> List[dict]:
    start = _parse_range(range_str).isoformat()
    client = get_client()
    result = (
        client.table("wellness")
        .select("*")
        .eq("user_id", user_id)
        .gte("timestamp", start)
        .order("timestamp")
        .execute()
    )
    return result.data


def fetch_workout_quality(user_id: str, range_str: str = "7d") -> List[dict]:
    start = _parse_range(range_str).isoformat()
    client = get_client()
    result = (
        client.table("workout_quality")
        .select("*")
        .eq("user_id", user_id)
        .gte("timestamp", start)
        .order("timestamp")
        .execute()
    )
    return result.data


def compute_kpis(user_id: str, range_str: str = "7d") -> dict:
    meals = fetch_meals(user_id, range_str)
    workouts = fetch_workouts(user_id, range_str)
    bodyweight = fetch_bodyweight(user_id, range_str)
    wellness = fetch_wellness(user_id, range_str)
    workout_quality = fetch_workout_quality(user_id, range_str)

    # Group meals by day
    daily_cals: Dict[str, int] = defaultdict(int)
    daily_protein: Dict[str, int] = defaultdict(int)
    for m in meals:
        day = _date_key(m["timestamp"])
        daily_cals[day] += m.get("calories", 0)
        daily_protein[day] += m.get("protein_g", 0)

    num_days = len(daily_cals) or 1
    avg_daily_calories = round(sum(daily_cals.values()) / num_days)
    avg_daily_protein = round(sum(daily_protein.values()) / num_days)

    # Current weight (most recent entry across any range)
    current_weight = None
    if bodyweight:
        current_weight = bodyweight[-1].get("weight_lbs")
    else:
        client = get_client()
        result = (
            client.table("bodyweight")
            .select("weight_lbs")
            .eq("user_id", user_id)
            .order("timestamp", desc=True)
            .limit(1)
            .execute()
        )
        if result.data:
            current_weight = result.data[0]["weight_lbs"]

    # Calorie balance: total intake - total workout burn
    total_intake = sum(daily_cals.values())
    total_burned = sum(w.get("estimated_calories_burned", 0) for w in workouts)
    calorie_balance = total_intake - total_burned

    # Average symptom score
    avg_symptom_score = None
    if wellness:
        avg_symptom_score = round(sum(w["symptom_score"] for w in wellness) / len(wellness), 1)

    # Average workout performance
    avg_performance = None
    if workout_quality:
        avg_performance = round(
            sum(w["performance_score"] for w in workout_quality) / len(workout_quality), 1
        )

    return {
        "avg_daily_calories": avg_daily_calories,
        "avg_daily_protein": avg_daily_protein,
        "current_weight": current_weight,
        "calorie_balance": calorie_balance,
        "avg_symptom_score": avg_symptom_score,
        "avg_performance": avg_performance,
    }


def compute_daily_meals(user_id: str, range_str: str = "7d") -> List[dict]:
    meals = fetch_meals(user_id, range_str)
    daily: Dict[str, Dict[str, int]] = defaultdict(lambda: {
        "calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0,
    })
    for m in meals:
        day = _date_key(m["timestamp"])
        daily[day]["calories"] += m.get("calories", 0)
        daily[day]["protein_g"] += m.get("protein_g", 0)
        daily[day]["carbs_g"] += m.get("carbs_g", 0)
        daily[day]["fat_g"] += m.get("fat_g", 0)

    return [
        {"date": day, **macros}
        for day, macros in sorted(daily.items())
    ]


def compute_calorie_balance(user_id: str, range_str: str = "7d") -> List[dict]:
    meals = fetch_meals(user_id, range_str)
    workouts = fetch_workouts(user_id, range_str)

    daily_intake: Dict[str, int] = defaultdict(int)
    daily_burn: Dict[str, int] = defaultdict(int)

    for m in meals:
        day = _date_key(m["timestamp"])
        daily_intake[day] += m.get("calories", 0)

    for w in workouts:
        day = _date_key(w["timestamp"])
        daily_burn[day] += w.get("estimated_calories_burned", 0)

    all_days = sorted(set(daily_intake.keys()) | set(daily_burn.keys()))
    return [
        {
            "date": day,
            "intake": daily_intake[day],
            "burned": daily_burn[day],
            "net": daily_intake[day] - daily_burn[day],
        }
        for day in all_days
    ]


def fetch_daily(user_id: str, date_str: str) -> dict:
    """Fetch all data for a specific date (YYYY-MM-DD)."""
    start = f"{date_str}T00:00:00-05:00"
    end = f"{date_str}T23:59:59-05:00"
    client = get_client()

    meals = (
        client.table("meals")
        .select("*")
        .eq("user_id", user_id)
        .gte("timestamp", start)
        .lte("timestamp", end)
        .order("timestamp")
        .execute()
    ).data

    workouts = (
        client.table("workouts")
        .select("*")
        .eq("user_id", user_id)
        .gte("timestamp", start)
        .lte("timestamp", end)
        .order("timestamp")
        .execute()
    ).data

    wellness = (
        client.table("wellness")
        .select("*")
        .eq("user_id", user_id)
        .gte("timestamp", start)
        .lte("timestamp", end)
        .execute()
    ).data

    workout_quality = (
        client.table("workout_quality")
        .select("*")
        .eq("user_id", user_id)
        .gte("timestamp", start)
        .lte("timestamp", end)
        .execute()
    ).data

    total_calories = sum(m.get("calories", 0) for m in meals)
    total_protein = sum(m.get("protein_g", 0) for m in meals)
    total_carbs = sum(m.get("carbs_g", 0) for m in meals)
    total_fat = sum(m.get("fat_g", 0) for m in meals)

    exercises = fetch_daily_exercises(user_id, date_str)

    workout_info = None
    if workouts:
        w = workouts[0]
        workout_info = {
            "description": w.get("description", ""),
            "calories_burned": w.get("estimated_calories_burned", 0),
            "intensity": w.get("intensity_score"),
        }

    performance = None
    if workout_quality:
        performance = workout_quality[0].get("performance_score")

    symptom_score = None
    if wellness:
        symptom_score = wellness[0].get("symptom_score")

    return {
        "date": date_str,
        "calories": total_calories,
        "protein_g": total_protein,
        "carbs_g": total_carbs,
        "fat_g": total_fat,
        "meals": [
            {
                "description": m.get("description", ""),
                "calories": m.get("calories", 0),
                "protein_g": m.get("protein_g", 0),
                "carbs_g": m.get("carbs_g", 0),
                "fat_g": m.get("fat_g", 0),
                "timestamp": m.get("timestamp", ""),
            }
            for m in meals
        ],
        "exercises": exercises,
        "workout": workout_info,
        "performance": performance,
        "symptom_score": symptom_score,
    }


def get_logged_dates(user_id: str, range_str: str = "7d") -> List[str]:
    """Return sorted list of unique dates that have any logged data."""
    start = _parse_range(range_str).isoformat()
    client = get_client()

    dates = set()
    for table in ["meals", "workouts", "bodyweight", "wellness", "workout_quality"]:
        result = (
            client.table(table)
            .select("timestamp")
            .eq("user_id", user_id)
            .gte("timestamp", start)
            .execute()
        )
        for row in result.data:
            dates.add(row["timestamp"][:10])

    return sorted(dates)


def fetch_all_logs(user_id: str, range_str: str = "30d", type_filter: str = "all") -> List[dict]:
    """Fetch all log entries across all tables, merged and sorted by timestamp."""
    start = _parse_range(range_str).isoformat()
    client = get_client()
    entries = []

    table_configs = {
        "meal": ("meals", lambda r: {
            "id": r["id"], "timestamp": r["timestamp"], "type": "meal",
            "description": r.get("description", ""),
            "value": f"{r.get('calories', 0)} kcal",
            "protein": r.get("protein_g"), "carbs": r.get("carbs_g"), "fat": r.get("fat_g"),
        }),
        "workout": ("workouts", lambda r: {
            "id": r["id"], "timestamp": r["timestamp"], "type": "workout",
            "description": r.get("description", ""),
            "value": f"{r.get('estimated_calories_burned', 0)} kcal burned",
            "protein": None, "carbs": None, "fat": None,
        }),
        "exercise": ("exercises", lambda r: {
            "id": r["id"], "timestamp": r["timestamp"], "type": "exercise",
            "description": r.get("exercise_name", ""),
            "value": f"{r.get('sets', 0)}x{r.get('reps', 0)} @ {r.get('weight_lbs', 0)} lbs",
            "protein": None, "carbs": None, "fat": None,
        }),
        "weight": ("bodyweight", lambda r: {
            "id": r["id"], "timestamp": r["timestamp"], "type": "weight",
            "description": "Weigh-In",
            "value": f"{r.get('weight_lbs', 0)} lbs",
            "protein": None, "carbs": None, "fat": None,
        }),
        "wellness": ("wellness", lambda r: {
            "id": r["id"], "timestamp": r["timestamp"], "type": "wellness",
            "description": r.get("symptom") or "Symptom Score",
            "value": f"{r.get('symptom_score', 0)}/10",
            "protein": None, "carbs": None, "fat": None,
        }),
    }

    types_to_fetch = [type_filter] if type_filter != "all" else list(table_configs.keys())

    for t in types_to_fetch:
        if t not in table_configs:
            continue
        table_name, transform = table_configs[t]
        result = (
            client.table(table_name)
            .select("*")
            .eq("user_id", user_id)
            .gte("timestamp", start)
            .order("timestamp", desc=True)
            .execute()
        )
        for row in result.data:
            entries.append(transform(row))

    entries.sort(key=lambda x: x["timestamp"], reverse=True)
    return entries


def fetch_exercises(user_id: str, range_str: str = "30d") -> List[dict]:
    start = _parse_range(range_str).isoformat()
    client = get_client()
    result = (
        client.table("exercises")
        .select("*")
        .eq("user_id", user_id)
        .gte("timestamp", start)
        .order("timestamp", desc=True)
        .execute()
    )
    return result.data


def fetch_exercise_names(user_id: str) -> List[str]:
    client = get_client()
    result = (
        client.table("exercises")
        .select("exercise_name")
        .eq("user_id", user_id)
        .execute()
    )
    return sorted(set(row["exercise_name"] for row in result.data))


def fetch_exercise_history(user_id: str, exercise_name: str, range_str: str = "90d") -> List[dict]:
    start = _parse_range(range_str).isoformat()
    client = get_client()
    result = (
        client.table("exercises")
        .select("*")
        .eq("user_id", user_id)
        .eq("exercise_name", exercise_name)
        .gte("timestamp", start)
        .order("timestamp")
        .execute()
    )
    return result.data


def fetch_daily_exercises(user_id: str, date_str: str) -> List[dict]:
    """Fetch all exercises for a specific date (YYYY-MM-DD)."""
    start = f"{date_str}T00:00:00-05:00"
    end = f"{date_str}T23:59:59-05:00"
    client = get_client()
    result = (
        client.table("exercises")
        .select("*")
        .eq("user_id", user_id)
        .gte("timestamp", start)
        .lte("timestamp", end)
        .order("timestamp")
        .execute()
    )
    return [
        {
            "exercise_name": r.get("exercise_name", ""),
            "sets": r.get("sets", 0),
            "reps": r.get("reps", 0),
            "weight_lbs": r.get("weight_lbs", 0),
            "notes": r.get("notes"),
        }
        for r in result.data
    ]


def compute_exercise_prs(user_id: str) -> List[dict]:
    client = get_client()
    result = (
        client.table("exercises")
        .select("*")
        .eq("user_id", user_id)
        .order("weight_lbs", desc=True)
        .execute()
    )
    prs = {}
    for row in result.data:
        name = row["exercise_name"]
        if name not in prs or row["weight_lbs"] > prs[name]["weight_lbs"]:
            prs[name] = row
    return sorted(prs.values(), key=lambda x: x["exercise_name"])


