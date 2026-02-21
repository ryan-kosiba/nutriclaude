# Stage 1: Build frontend
FROM node:20-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Stage 2: Python backend
FROM python:3.11-slim
WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .
COPY system-prompt.md .

# Copy built frontend to where main.py expects it:
# FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"
# With main.py at /app/main.py, parent.parent is /, so it looks for /frontend/dist
COPY --from=frontend-build /app/frontend/dist /frontend/dist

EXPOSE 8000
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
