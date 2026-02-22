import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv

load_dotenv()

from routes.auth import router as auth_router
from routes.telegram import router as telegram_router
from routes.confirm import router as confirm_router
from routes.dashboard import router as dashboard_router
from routes.goals import router as goals_router

logger = logging.getLogger("nutriclaude")


@asynccontextmanager
async def lifespan(app_instance: FastAPI):
    """Start Telegram bot polling on startup, stop on shutdown."""
    token = os.getenv("TELEGRAM_BOT_TOKEN", "")
    if token:
        from telegram.ext import Application, CommandHandler, MessageHandler, CallbackQueryHandler, filters
        from bot import start_command, login_command, feedback_command, handle_message, handle_callback

        bot_app = Application.builder().token(token).build()
        bot_app.add_handler(CommandHandler("start", start_command))
        bot_app.add_handler(CommandHandler("login", login_command))
        bot_app.add_handler(CommandHandler("feedback", feedback_command))
        bot_app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
        bot_app.add_handler(CallbackQueryHandler(handle_callback))

        await bot_app.initialize()
        await bot_app.start()
        await bot_app.updater.start_polling()
        logger.info("Telegram bot started")
        yield
        await bot_app.updater.stop()
        await bot_app.stop()
        await bot_app.shutdown()
        logger.info("Telegram bot stopped")
    else:
        logger.warning("TELEGRAM_BOT_TOKEN not set, bot disabled")
        yield


app = FastAPI(title="Nutriclaude", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(telegram_router, prefix="/api")
app.include_router(confirm_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(goals_router, prefix="/api")


@app.get("/health")
async def health_check():
    return {"status": "ok"}


# Serve frontend static files (built with `npm run build` in frontend/)
FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if FRONTEND_DIST.is_dir():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """Serve the React SPA for any non-API route."""
        file = FRONTEND_DIST / full_path
        if file.is_file():
            return FileResponse(file)
        return FileResponse(FRONTEND_DIST / "index.html")
