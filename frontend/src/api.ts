const BASE = '/api';

async function fetchJson<T>(url: string): Promise<T> {
  const token = localStorage.getItem('session_token');
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, { headers });
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

export interface DailyData {
  date: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  meals: MealDetail[];
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

export const api = {
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
  exercisePRs: () => fetchJson<ExercisePR[]>(`${BASE}/exercise-prs`),
};
