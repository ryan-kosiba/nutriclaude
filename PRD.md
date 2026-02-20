# PRD: Nutriclaude

## 1. Overview

### Product Name

Nutriclaude

### Vision

Nutriclaude is a lightweight, AI-powered personal fitness and nutrition tracker that allows logging meals, workouts, bodyweight, and qualitative wellness metrics via natural language through Telegram.

Claude converts free-text messages into structured JSON, which is validated and stored in Supabase. A React dashboard visualizes performance trends, KPIs, and macro breakdowns.

This is a personal-use system with a public GitHub repository.

## 2. Goals & Non-Goals

### Goals

- Log meals via free text
- Log workouts via free text
- Log bodyweight changes
- Log qualitative metrics:
  - Fatigue (0–10)
  - Exercise performance rating (0–10)
- Extract structured JSON via Claude
- Confirm entry via Telegram before committing to the database
- Store all data in Supabase
- Visualize KPIs and trends in a React dashboard
- Provide intelligent weekly summaries with pattern detection
- Track calorie balance (intake vs estimated expenditure)

### Non-Goals

- Competing with commercial nutrition apps
- Wearable integrations
- Apple Health / Google Fit sync
- Editing or updating records (insert-only for now)
- Micronutrient tracking
- Automated meal planning

## 3. User Persona

| Attribute         | Value                    |
| ----------------- | ------------------------ |
| Primary User      | Single user (personal)   |
| Usage Frequency   | 5–7 Telegram messages/day |
| Interaction Surface | Telegram only          |
| Dashboard         | React web app            |

## 4. System Architecture

### High-Level Architecture

```
Telegram → Backend Server → Claude API
                ↓
          JSON Structured Output
                ↓
            Supabase (Postgres)
                ↓
          REST API Layer
                ↓
          React Dashboard
```

### Components

#### 1. Telegram Bot

- Receives natural language input
- Sends message to backend
- Displays Claude confirmation summary
- Awaits confirmation before commit

#### 2. Backend Server

- Handles Telegram webhook
- Sends message to Claude
- Validates JSON schema
- Stores pending log in `pending_logs` table until confirmed
- Stores validated data in Supabase on confirmation
- Computes derived metrics (BMR, deficit/surplus)

#### 3. Claude

Responsible for:

- Intent classification (meal / workout / weight / wellness)
- Entity extraction
- Macro estimation
- Calorie estimation
- JSON formatting (strict schema output)

#### 4. Supabase

- PostgreSQL database
- Row-level security
- Encrypted at rest
- API access for dashboard

#### 5. React Dashboard

Displays:

- Daily KPIs
- Weekly summaries
- Stacked macro breakdown charts
- Trends over time

## 5. Core Functional Requirements

### 5.1 Meal Logging

**Input Example:**

> Had a chipotle bowl with chicken, rice, beans and guac

**Claude Responsibilities:**

- Identify meal
- Estimate calories
- Estimate macros (protein, carbs, fat)
- Return structured JSON

**Schema:**

```json
{
  "type": "meal",
  "timestamp": "ISO8601",
  "description": "Chipotle bowl with chicken, rice, beans and guac",
  "calories": 850,
  "protein_g": 55,
  "carbs_g": 80,
  "fat_g": 35
}
```

**Telegram Confirmation Message:**

```
Meal detected:
Calories: 850
Protein: 55g
Carbs: 80g
Fat: 35g

Confirm save? (yes/no)
```

### 5.2 Workout Logging

**Input Example:**

> Did chest day. Bench press, incline dumbbell, dips. About an hour.

**Claude should:**

- Classify as workout
- Estimate calorie burn
- Return structured JSON

**Schema:**

```json
{
  "type": "workout",
  "timestamp": "ISO8601",
  "description": "Chest workout: bench, incline dumbbell, dips",
  "estimated_calories_burned": 420,
  "intensity_score": 8
}
```

### 5.3 Bodyweight Logging

**Input Example:**

> Weighed 182.4 this morning

**Schema:**

```json
{
  "type": "bodyweight",
  "timestamp": "ISO8601",
  "weight_lbs": 182.4
}
```

### 5.4 Qualitative Metrics

#### Fatigue / Malaise

**Input Example:**

> Felt very fatigued today, 7 out of 10

**Schema:**

```json
{
  "type": "wellness",
  "timestamp": "ISO8601",
  "fatigue_score": 7
}
```

#### Workout Quality Score

**Schema:**

```json
{
  "type": "workout_quality",
  "timestamp": "ISO8601",
  "performance_score": 9
}
```

## 6. Data Model (Supabase)

### Tables

All tables include a `user_id` column for identification.

#### `meals`

| Column      | Type         |
| ----------- | ------------ |
| id          | UUID (PK)    |
| user_id     | TEXT         |
| timestamp   | TIMESTAMPTZ  |
| description | TEXT         |
| calories    | INTEGER      |
| protein_g   | INTEGER      |
| carbs_g     | INTEGER      |
| fat_g       | INTEGER      |

#### `workouts`

| Column                   | Type        |
| ------------------------ | ----------- |
| id                       | UUID (PK)   |
| user_id                  | TEXT        |
| timestamp                | TIMESTAMPTZ |
| description              | TEXT        |
| estimated_calories_burned | INTEGER    |
| intensity_score          | INTEGER     |

#### `bodyweight`

| Column     | Type           |
| ---------- | -------------- |
| id         | UUID (PK)      |
| user_id    | TEXT           |
| timestamp  | TIMESTAMPTZ    |
| weight_lbs | DECIMAL(6,2)   |

#### `wellness`

| Column        | Type        |
| ------------- | ----------- |
| id            | UUID (PK)   |
| user_id       | TEXT        |
| timestamp     | TIMESTAMPTZ |
| fatigue_score | INTEGER     |

#### `workout_quality`

| Column           | Type        |
| ---------------- | ----------- |
| id               | UUID (PK)   |
| user_id          | TEXT        |
| timestamp        | TIMESTAMPTZ |
| performance_score | INTEGER    |

#### `pending_logs`

| Column     | Type        |
| ---------- | ----------- |
| id         | UUID (PK)   |
| user_id    | TEXT        |
| telegram_chat_id | TEXT  |
| type       | TEXT        |
| payload    | JSONB       |
| created_at | TIMESTAMPTZ |

## 7. Calculations

### BMR Calculation

Use the Mifflin-St Jeor formula.

### Calorie Balance

```
Net Calories = Intake − (BMR + Workout Calories)
```

### Weekly Summary Metrics

- Days in surplus
- Days in deficit
- Average protein intake
- Average calorie intake
- Average fatigue score
- Correlation trends:
  - Low protein → higher fatigue
  - Calorie deficit → workout performance drops

No warnings are issued. Only observational summaries are displayed.

## 8. Dashboard Requirements (React)

### 8.1 KPI Cards

- Average daily calories
- Average daily protein
- Current weight
- 7-day calorie balance
- Average fatigue score
- Average workout performance score

### 8.2 Charts

- **Stacked Bar Chart** — Calories broken into protein, carbs, fat
- **Line Chart** — Weight trend
- **Line Chart** — Net calorie balance
- **Line Chart** — Fatigue over time

### 8.3 AI Summary Section

Generated weekly via Claude.

**Example:**

> Over the last 7 days:
> - 5 days were in caloric deficit
> - Average protein intake was 140g
> - Fatigue averaged 6.8 and increased on low calorie days
> - Workout performance dipped on highest deficit days

## 9. Claude Prompt Design Requirements

Claude must:

- Classify message type
- Extract structured data
- Estimate calories/macros when relevant
- Return strict JSON matching schema
- Output JSON only (no commentary)

Prompt must enforce:

- Strict schema adherence
- No natural language explanation
- Deterministic formatting

## 10. Security & Privacy

- Supabase row-level security (keyed on `user_id`)
- Encryption at rest
- Backend-only API keys
- Telegram ID validation
- Schema validation before database insert

## 11. API Design

### `POST /api/log`

- Receives Telegram message
- Sends to Claude
- Stores parsed result in `pending_logs`
- Returns structured summary to Telegram

### `POST /api/confirm`

- Moves validated record from `pending_logs` into the appropriate table
- Deletes the pending entry

### `GET /api/kpis?range=7d`

- Aggregated KPI card data (averages, current weight, calorie balance)

### `GET /api/meals?range=7d`

- Time-series meal data for macro breakdown chart

### `GET /api/weight?range=30d`

- Weight trend data for line chart

### `GET /api/wellness?range=7d`

- Fatigue score time-series

### `GET /api/workouts?range=7d`

- Workout data with calories burned and intensity

### `GET /api/summary`

- Claude-generated weekly summary with pattern detection

All dashboard endpoints accept a `range` query parameter (e.g., `7d`, `14d`, `30d`).

## 12. Success Metrics

- 100% successful JSON parsing rate
- < 3 second response time
- Macro estimates within reasonable bounds
- Daily logging compliance >= 90%

## 13. Risks & Mitigations

| Risk                        | Mitigation                          |
| --------------------------- | ----------------------------------- |
| Claude hallucinates macros  | Constrain schema + sanity bounds    |
| Incorrect calorie estimation | Accept as approximation            |
| JSON formatting errors      | Strict output parser               |
| Misclassification           | Explicit classification instructions |

## 14. Milestones

### Phase 1 — Core Logging

- Telegram bot
- Claude structured extraction
- Supabase insert
- Confirmation loop via `pending_logs`

### Phase 2 — Dashboard

- React app
- KPI metrics
- Charts

### Phase 3 — Intelligence Layer

- Weekly pattern detection
- Summary generation

## 15. Future Expansion

- Editable logs
- Macro targets
- Automated recommendations
- Coaching mode
- Advanced correlation analytics

---

**Summary:** Nutriclaude is a natural-language-to-structured-fitness-database pipeline powered by Claude, designed for minimal friction logging and high-signal analytics through a modern dashboard interface.
