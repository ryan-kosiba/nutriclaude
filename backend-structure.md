# Nutriclaude Backend Structure

## Recommended Stack

- Python 3.11+
- FastAPI
- Pydantic for schema validation
- Supabase Python client (`supabase-py`)
- Anthropic Python SDK
- python-telegram-bot
- Uvicorn

## Suggested Folder Structure

```
backend/
├── main.py
├── config/
│   └── settings.py
├── routes/
│   ├── telegram.py
│   ├── confirm.py
│   └── dashboard.py
├── services/
│   ├── claude_service.py
│   ├── supabase_service.py
│   ├── aggregation_service.py
│   └── validation_service.py
├── schemas/
│   └── log_schemas.py
├── utils/
│   ├── logger.py
│   └── helpers.py
└── requirements.txt
```

## Key Responsibilities

### `telegram.py`

- Webhook handler
- Pass message to Claude
- Store parsed result in `pending_logs`

### `confirm.py`

- Accept confirmation from Telegram
- Move entry from `pending_logs` to the appropriate table
- Delete the pending entry

### `dashboard.py`

- Serve focused API endpoints for the React dashboard:
  - `GET /api/kpis?range=7d` — Aggregated KPI card data
  - `GET /api/meals?range=7d` — Time-series meal/macro data
  - `GET /api/weight?range=30d` — Weight trend data
  - `GET /api/wellness?range=7d` — Fatigue score time-series
  - `GET /api/workouts?range=7d` — Workout data with intensity/calories
  - `GET /api/summary` — Claude-generated weekly summary

### `claude_service.py`

- Send prompt
- Enforce JSON-only
- Return parsed object

### `validation_service.py`

- Pydantic validation
- Reject malformed entries

### `supabase_service.py`

- Insert validated data
- Manage `pending_logs` lifecycle
- Fetch dashboard aggregates

### `aggregation_service.py`

- Compute weekly summaries
- Compute calorie balance

## Environment Variables

```
TELEGRAM_BOT_TOKEN
ANTHROPIC_API_KEY
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```
