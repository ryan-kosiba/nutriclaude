# Nutriclaude Prompting Strategy

## Objective

Claude must:

- Classify intent
- Extract structured data
- Estimate calories/macros
- Return strict JSON
- Never return commentary

## System Prompt Design

### Core Rules

- Output JSON only
- No explanation text
- No markdown
- Must match schema exactly
- Missing values must be `null`
- Timestamp must be ISO8601
- Must classify into one of:
  - `meal`
  - `workout`
  - `bodyweight`
  - `wellness`
  - `workout_quality`

## Type-Specific Schemas

### Meal

```json
{
  "type": "meal",
  "timestamp": "ISO8601",
  "description": "string",
  "calories": 850,
  "protein_g": 55,
  "carbs_g": 80,
  "fat_g": 35
}
```

### Workout

```json
{
  "type": "workout",
  "timestamp": "ISO8601",
  "description": "string",
  "estimated_calories_burned": 420,
  "intensity_score": 8
}
```

### Bodyweight

```json
{
  "type": "bodyweight",
  "timestamp": "ISO8601",
  "weight_lbs": 182.4
}
```

### Wellness

```json
{
  "type": "wellness",
  "timestamp": "ISO8601",
  "fatigue_score": 7
}
```

### Workout Quality

```json
{
  "type": "workout_quality",
  "timestamp": "ISO8601",
  "performance_score": 9
}
```

## Prompt Design Principles

- Deterministic language
- Explicit constraints
- Avoid open-ended reasoning
- Encourage conservative calorie estimates
- Avoid hallucinated precision

## Failure Handling

If classification is unclear:

- Return `type: "unknown"`
- Backend should reject unknown types

```json
{
  "type": "unknown",
  "timestamp": "ISO8601"
}
```
