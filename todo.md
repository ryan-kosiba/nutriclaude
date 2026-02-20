# Nutriclaude Build Checklist

## 1. Project Scaffold

- [x] Activate and verify `myenv` virtual environment
- [x] Install Python dependencies (FastAPI, Uvicorn, Pydantic, Anthropic SDK, supabase-py, python-telegram-bot)
- [x] Generate `requirements.txt`
- [x] Create `backend/` folder structure per `backend-structure.md`
- [x] Set up `main.py` with FastAPI app and route registration
- [x] Create `config/settings.py` with environment variable loading
- [x] Create `.env.example` with required variable names
- [x] Add `.gitignore` (myenv, .env, __pycache__, etc.)
- [x] Scaffold empty route files (`telegram.py`, `confirm.py`, `dashboard.py`)
- [x] Scaffold empty service files (`claude_service.py`, `supabase_service.py`, `validation_service.py`, `aggregation_service.py`)
- [x] Verify server starts with `uvicorn`

## 2. Database

- [x] Create Supabase project (or connect to existing)
- [x] Run `meals` table creation SQL
- [x] Run `workouts` table creation SQL
- [x] Run `bodyweight` table creation SQL
- [x] Run `wellness` table creation SQL
- [x] Run `workout_quality` table creation SQL
- [x] Run `pending_logs` table creation SQL
- [x] Create all indexes (timestamp + user_id for each table)
- [ ] Enable Row-Level Security on all tables
- [x] Verify tables and indexes via Supabase dashboard

## 3. Pydantic Schemas + Validation Service

- [x] Define `MealLog` Pydantic model
- [x] Define `WorkoutLog` Pydantic model
- [x] Define `BodyweightLog` Pydantic model
- [x] Define `WellnessLog` Pydantic model
- [x] Define `WorkoutQualityLog` Pydantic model
- [x] Define `UnknownLog` Pydantic model
- [x] Define `PendingLog` Pydantic model
- [x] Create discriminated union type for all log types
- [x] Implement `validate_log()` function in `validation_service.py`
- [x] Test validation with valid payloads for each type
- [x] Test validation rejects malformed payloads

## 4. Claude Service

- [x] Initialize Anthropic client in `claude_service.py`
- [x] Load system prompt from `system-prompt.md`
- [x] Implement `extract_log(message: str)` function
- [x] Parse Claude response as JSON
- [x] Pass parsed JSON through Pydantic validation
- [x] Handle Claude API errors gracefully
- [x] Test with sample meal input
- [x] Test with sample workout input
- [x] Test with sample bodyweight input
- [x] Test with sample wellness input
- [x] Test with sample workout quality input
- [x] Test with ambiguous input (should return `unknown`)

## 5. Supabase Service

- [x] Initialize Supabase client in `supabase_service.py`
- [x] Implement `create_pending_log()` — insert into `pending_logs`
- [x] Implement `get_pending_log()` — fetch by ID
- [x] Implement `confirm_log()` — move from `pending_logs` to appropriate table
- [x] Implement `delete_pending_log()` — clean up after confirm/reject
- [x] Implement `insert_meal()`
- [x] Implement `insert_workout()`
- [x] Implement `insert_bodyweight()`
- [x] Implement `insert_wellness()`
- [x] Implement `insert_workout_quality()`
- [x] Test full pending → confirm → insert flow
- [x] Test pending → reject → delete flow

## 6. Telegram Bot + Webhook

- [x] Create Telegram bot via BotFather and get token
- [x] Set up polling-based bot in `bot.py`
- [x] Parse incoming message text from Telegram update
- [x] Validate Telegram user ID (single-user auth)
- [x] Send message to Claude service
- [x] Store Claude response in `pending_logs` via Supabase service
- [x] Format confirmation summary message
- [x] Send confirmation message back to Telegram with yes/no
- [x] Handle "yes" callback — confirm and insert log
- [x] Handle "no" callback — delete pending log
- [x] Send success/failure response to user
- [x] Support multiple logs in a single message
- [x] Test full end-to-end flow via Telegram
