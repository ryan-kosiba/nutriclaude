# Nutriclaude Architecture

## Overview

Nutriclaude is a natural-language fitness logging system that converts Telegram messages into structured database records using Claude. It is designed to be deterministic, modular, and analytics-ready.

## High-Level Architecture

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

## Core Components

### 1. Telegram Bot

**Responsibilities:**

- Receive natural language messages
- Forward message to backend
- Display confirmation summary
- Await user confirmation before commit

**Interaction Model:**

- Pure natural language
- Confirmation required before insert
- Insert-only (no edits)

### 2. Backend Server

**Responsibilities:**

- Webhook handling
- Claude API calls
- JSON schema validation
- Store pending entries in `pending_logs` table
- Confirmation loop (move from `pending_logs` to final table)
- Supabase insertion
- Aggregation logic for dashboard

**Design Principles:**

- Deterministic AI workflow
- Schema-first validation
- Clear separation between extraction and storage
- Idempotent confirmation endpoint

### 3. Claude

**Responsibilities:**

- Intent classification
- Entity extraction
- Macro estimation
- Calorie estimation
- Strict JSON output

**Constraints:**

- No natural language commentary
- JSON-only output
- Must match defined schema exactly

### 4. Supabase (PostgreSQL)

**Responsibilities:**

- Store structured records (with `user_id` on all tables)
- Enforce row-level security (keyed on `user_id`)
- Support time-series analytics
- Serve dashboard queries
- Hold pending logs until confirmation

**Design Goals:**

- Normalized structure
- Insert-only logging
- Analytics-ready schema

### 5. React Dashboard

**Responsibilities:**

- Display KPIs
- Show macro breakdown (stacked bar)
- Show weight trends
- Show fatigue trends
- Show weekly AI summary

**Data Fetching:**

The dashboard consumes multiple focused API endpoints, each with a `range` query parameter:

| Endpoint              | Purpose                              |
| --------------------- | ------------------------------------ |
| `GET /api/kpis`       | Aggregated KPI card data             |
| `GET /api/meals`      | Time-series meal/macro data          |
| `GET /api/weight`     | Weight trend data                    |
| `GET /api/wellness`   | Fatigue score time-series            |
| `GET /api/workouts`   | Workout data with intensity/calories |
| `GET /api/summary`    | Claude-generated weekly summary      |

## Data Flow

1. User sends Telegram message.
2. Backend receives webhook.
3. Backend sends message to Claude.
4. Claude returns structured JSON.
5. Backend validates JSON against schema.
6. Backend stores entry in `pending_logs` table.
7. Backend sends confirmation summary to Telegram.
8. User confirms.
9. Backend moves record from `pending_logs` to the appropriate table.
10. Dashboard fetches aggregated data via API endpoints.

## Security Architecture

- Telegram ID validation
- Supabase Row-Level Security (RLS) keyed on `user_id`
- Encrypted database storage
- Backend-only API keys
- Strict schema validation before insert

## Design Philosophy

Nutriclaude is:

```
Natural language → Structured JSON → Validated Insert → Analytics
```

The system prioritizes:

- **Determinism**
- **Simplicity**
- **Observability**
- **Extensibility**
