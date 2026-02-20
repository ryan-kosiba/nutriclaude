# Nutriclaude

A personal Telegram assistant to log meals and workouts via natural language, powered by Claude. Tracks macros, bodyweight, and wellness metrics with a React analytics dashboard.

## How It Works

1. Send a natural language message to the Telegram bot
2. Claude extracts structured data (calories, macros, workout info, etc.)
3. Confirm the parsed entry via Telegram
4. Data is stored in Supabase
5. View trends and KPIs on the React dashboard

## Tech Stack

- **Bot:** Telegram
- **Backend:** Python, FastAPI
- **AI:** Claude API (structured JSON extraction)
- **Database:** Supabase (PostgreSQL)
- **Dashboard:** React
- **Validation:** Pydantic

## Documentation

- [PRD](PRD.md)
- [Architecture](archtecture.md)
- [Prompting Strategy](prompting.md)
- [Database Schema](database-schema.md)
- [Backend Structure](backend-structure.md)
- [System Prompt](system-prompt.md)
- [Roadmap](roadmap.md)
- [Contributing](contributing.md)
