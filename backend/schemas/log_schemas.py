from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional, Union

from pydantic import BaseModel, Field, validator


class MealLog(BaseModel):
    type: Literal["meal"]
    timestamp: datetime
    description: str
    calories: int = Field(ge=0)
    protein_g: int = Field(ge=0)
    carbs_g: int = Field(ge=0)
    fat_g: int = Field(ge=0)


class WorkoutLog(BaseModel):
    type: Literal["workout"]
    timestamp: datetime
    description: str
    estimated_calories_burned: int = Field(ge=0)
    intensity_score: Optional[int] = Field(default=None, ge=0, le=10)


class BodyweightLog(BaseModel):
    type: Literal["bodyweight"]
    timestamp: datetime
    weight_lbs: float = Field(gt=0)


class WellnessLog(BaseModel):
    type: Literal["wellness"]
    timestamp: datetime
    symptom_score: int = Field(ge=0, le=10)
    symptom: Optional[str] = None


class WorkoutQualityLog(BaseModel):
    type: Literal["workout_quality"]
    timestamp: datetime
    performance_score: int = Field(ge=0, le=10)


class ExerciseLog(BaseModel):
    type: Literal["exercise"]
    timestamp: datetime
    exercise_name: str = Field(min_length=1)
    sets: int = Field(ge=1)
    reps: int = Field(ge=1)
    weight_lbs: float = Field(ge=0)
    notes: Optional[str] = None


class UnknownLog(BaseModel):
    type: Literal["unknown"]
    timestamp: datetime


class PendingLog(BaseModel):
    id: Optional[str] = None
    user_id: str
    telegram_chat_id: str
    type: str
    payload: dict
    created_at: Optional[datetime] = None


LogEntry = Union[MealLog, WorkoutLog, BodyweightLog, WellnessLog, WorkoutQualityLog, ExerciseLog, UnknownLog]


def parse_log(data: dict) -> LogEntry:
    """Parse a dict into the appropriate log type based on the 'type' field."""
    log_type = data.get("type")
    type_map = {
        "meal": MealLog,
        "workout": WorkoutLog,
        "bodyweight": BodyweightLog,
        "wellness": WellnessLog,
        "workout_quality": WorkoutQualityLog,
        "exercise": ExerciseLog,
        "unknown": UnknownLog,
    }
    model = type_map.get(log_type)
    if model is None:
        raise ValueError(f"Unsupported log type: {log_type}")
    return model(**data)
