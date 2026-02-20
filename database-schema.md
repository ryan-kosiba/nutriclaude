# Nutriclaude Database Schema

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Meals Table
CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  description TEXT NOT NULL,
  calories INTEGER NOT NULL CHECK (calories >= 0),
  protein_g INTEGER NOT NULL CHECK (protein_g >= 0),
  carbs_g INTEGER NOT NULL CHECK (carbs_g >= 0),
  fat_g INTEGER NOT NULL CHECK (fat_g >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workouts Table
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  description TEXT NOT NULL,
  estimated_calories_burned INTEGER NOT NULL CHECK (estimated_calories_burned >= 0),
  intensity_score INTEGER CHECK (intensity_score BETWEEN 0 AND 10),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bodyweight Table
CREATE TABLE bodyweight (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  weight_lbs DECIMAL(6,2) NOT NULL CHECK (weight_lbs > 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wellness Table
CREATE TABLE wellness (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  fatigue_score INTEGER NOT NULL CHECK (fatigue_score BETWEEN 0 AND 10),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workout Quality Table
CREATE TABLE workout_quality (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  performance_score INTEGER NOT NULL CHECK (performance_score BETWEEN 0 AND 10),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pending Logs Table (holds unconfirmed entries)
CREATE TABLE pending_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  telegram_chat_id TEXT NOT NULL,
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for time-series queries
CREATE INDEX idx_meals_timestamp ON meals(timestamp);
CREATE INDEX idx_meals_user_id ON meals(user_id);
CREATE INDEX idx_workouts_timestamp ON workouts(timestamp);
CREATE INDEX idx_workouts_user_id ON workouts(user_id);
CREATE INDEX idx_bodyweight_timestamp ON bodyweight(timestamp);
CREATE INDEX idx_bodyweight_user_id ON bodyweight(user_id);
CREATE INDEX idx_wellness_timestamp ON wellness(timestamp);
CREATE INDEX idx_wellness_user_id ON wellness(user_id);
CREATE INDEX idx_workout_quality_timestamp ON workout_quality(timestamp);
CREATE INDEX idx_workout_quality_user_id ON workout_quality(user_id);
CREATE INDEX idx_pending_logs_user_id ON pending_logs(user_id);
```
