const BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('session_token');
  const headers: Record<string, string> = { ...options?.headers as Record<string, string> };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, { ...options, headers });
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('session_token');
    window.location.href = '/';
    throw new Error('Unauthorized');
  }
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export interface KpiData {
  avg_daily_calories: number;
  avg_daily_protein: number;
  current_weight: number | null;
  calorie_balance: number;
  avg_fatigue: number | null;
  avg_performance: number | null;
}

export interface DailyMeal {
  date: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface WeightEntry {
  date: string;
  weight_lbs: number;
}

export interface CalorieBalanceEntry {
  date: string;
  intake: number;
  burned: number;
  net: number;
}

export interface MealDetail {
  description: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  timestamp: string;
}

export interface DailyExercise {
  exercise_name: string;
  sets: number;
  reps: number;
  weight_lbs: number;
  notes: string | null;
}

export interface DailyData {
  date: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  meals: MealDetail[];
  exercises: DailyExercise[];
  workout: { description: string; calories_burned: number; intensity: number | null } | null;
  performance: number | null;
  fatigue: number | null;
}

export interface ExerciseEntry {
  date: string;
  timestamp: string;
  exercise_name: string;
  sets: number;
  reps: number;
  weight_lbs: number;
  notes: string | null;
}

export interface ExerciseHistoryPoint {
  date: string;
  timestamp: string;
  sets: number;
  reps: number;
  weight_lbs: number;
  notes: string | null;
}

export interface ExercisePR {
  exercise_name: string;
  weight_lbs: number;
  sets: number;
  reps: number;
  date: string;
}

export interface LogHistoryEntry {
  id: string;
  timestamp: string;
  type: 'meal' | 'workout' | 'exercise' | 'weight' | 'wellness';
  description: string;
  value: string;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

export interface WellnessEntry {
  date: string;
  fatigue_score: number;
}

export interface PerformanceEntry {
  date: string;
  performance_score: number;
}

export interface Goals {
  current_weight_lbs?: number | null;
  height_feet?: number | null;
  height_inches?: number | null;
  target_weight_lbs?: number | null;
  daily_calories?: number | null;
  daily_protein_g?: number | null;
  max_carbs_g?: number | null;
  max_fat_g?: number | null;
}

export const api = {
  getGoals: () => fetchJson<Goals>(`${BASE}/goals`),
  updateGoals: (data: Goals) =>
    fetchJson<{ status: string }>(`${BASE}/goals`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  kpis: (range = '7d') => fetchJson<KpiData>(`${BASE}/kpis?range=${range}`),
  meals: (range = '7d') => fetchJson<DailyMeal[]>(`${BASE}/meals?range=${range}`),
  weight: (range = '30d') => fetchJson<WeightEntry[]>(`${BASE}/weight?range=${range}`),
  calorieBalance: (range = '7d') => fetchJson<CalorieBalanceEntry[]>(`${BASE}/calorie-balance?range=${range}`),
  daily: (date: string) => fetchJson<DailyData>(`${BASE}/daily?date=${date}`),
  dates: (range = '7d') => fetchJson<string[]>(`${BASE}/dates?range=${range}`),
  logHistory: (range = '30d', type = 'all') =>
    fetchJson<LogHistoryEntry[]>(`${BASE}/log-history?range=${range}&type=${type}`),
  exercises: (range = '30d') => fetchJson<ExerciseEntry[]>(`${BASE}/exercises?range=${range}`),
  exerciseNames: () => fetchJson<string[]>(`${BASE}/exercise-names`),
  exerciseHistory: (name: string, range = '90d') =>
    fetchJson<ExerciseHistoryPoint[]>(`${BASE}/exercise-history?name=${encodeURIComponent(name)}&range=${range}`),
  wellness: (range = '30d') => fetchJson<WellnessEntry[]>(`${BASE}/wellness?range=${range}`),
  performance: (range = '30d') => fetchJson<PerformanceEntry[]>(`${BASE}/performance?range=${range}`),
  exercisePRs: () => fetchJson<ExercisePR[]>(`${BASE}/exercise-prs`),
  workoutSummary: (date: string) => fetchJson<{ summary: string | null }>(`${BASE}/workout-summary?date=${date}`),
  updateLog: (type: string, id: string, data: Record<string, unknown>) =>
    fetchJson<{ status: string }>(`${BASE}/log/${type}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  deleteLog: (type: string, id: string) =>
    fetchJson<{ status: string }>(`${BASE}/log/${type}/${id}`, {
      method: 'DELETE',
    }),
};
