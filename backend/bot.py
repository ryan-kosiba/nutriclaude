"""Telegram bot using polling for local development."""
from __future__ import annotations

import os
import logging
from datetime import datetime, timedelta, timezone

import jwt
from dotenv import load_dotenv
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, CallbackQueryHandler, filters

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from config.settings import JWT_SECRET, APP_URL
from services.claude_service import extract_log
from services.supabase_service import create_pending_log, confirm_log, delete_pending_log, get_client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("nutriclaude.bot")


def _upsert_user(telegram_id: str, display_name: str) -> None:
    """Create or update user in users table."""
    client = get_client()
    existing = client.table("users").select("id").eq("telegram_id", telegram_id).execute()
    if not existing.data:
        client.table("users").insert({
            "telegram_id": telegram_id,
            "display_name": display_name,
        }).execute()
    elif display_name:
        client.table("users").update({
            "display_name": display_name,
        }).eq("telegram_id", telegram_id).execute()


def format_confirmation(log_type: str, data: dict) -> str:
    """Format a confirmation message based on log type."""
    if log_type == "meal":
        return (
            f"Meal detected:\n"
            f"  {data.get('description', 'N/A')}\n\n"
            f"Calories: {data.get('calories', 'N/A')}\n"
            f"Protein: {data.get('protein_g', 'N/A')}g\n"
            f"Carbs: {data.get('carbs_g', 'N/A')}g\n"
            f"Fat: {data.get('fat_g', 'N/A')}g"
        )
    elif log_type == "workout":
        intensity = data.get("intensity_score")
        intensity_str = f"\nIntensity: {intensity}/10" if intensity is not None else ""
        return (
            f"Workout detected:\n"
            f"  {data.get('description', 'N/A')}\n\n"
            f"Calories burned: {data.get('estimated_calories_burned', 'N/A')}"
            f"{intensity_str}"
        )
    elif log_type == "exercise":
        notes = data.get("notes")
        notes_str = f"\n({notes})" if notes else ""
        return (
            f"Exercise logged:\n"
            f"  {data.get('exercise_name', 'N/A')}\n\n"
            f"{data.get('sets', 'N/A')} sets x {data.get('reps', 'N/A')} reps @ {data.get('weight_lbs', 'N/A')} lbs"
            f"{notes_str}"
        )
    elif log_type == "bodyweight":
        return f"Bodyweight logged:\n  {data.get('weight_lbs', 'N/A')} lbs"
    elif log_type == "wellness":
        return f"Wellness logged:\n  Fatigue: {data.get('fatigue_score', 'N/A')}/10"
    elif log_type == "workout_quality":
        return f"Workout quality logged:\n  Performance: {data.get('performance_score', 'N/A')}/10"
    else:
        return "Could not understand that message."


async def start_command(update: Update, context) -> None:
    """Handle /start command — register user and show welcome."""
    user = update.effective_user
    telegram_id = str(user.id)
    display_name = user.full_name or user.username or ""

    _upsert_user(telegram_id, display_name)

    await update.message.reply_text(
        f"Welcome to Nutriclaude, {display_name}!\n\n"
        f"Send me a natural language message to log:\n"
        f"- Meals (e.g., 'Had a chipotle bowl')\n"
        f"- Workouts (e.g., 'Did chest day for an hour')\n"
        f"- Bodyweight (e.g., 'Weighed 182.4')\n"
        f"- Fatigue (e.g., 'Fatigue 7 out of 10')\n"
        f"- Workout quality (e.g., 'Session was 9/10')\n\n"
        f"Use /login to get a link to your personal dashboard."
    )


async def login_command(update: Update, context) -> None:
    """Generate a magic link for dashboard access."""
    user = update.effective_user
    telegram_id = str(user.id)
    display_name = user.full_name or user.username or ""

    _upsert_user(telegram_id, display_name)

    # Generate magic link JWT (5 min expiry)
    token_payload = {
        "telegram_id": telegram_id,
        "display_name": display_name,
        "type": "magic_link",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=5),
    }
    token = jwt.encode(token_payload, JWT_SECRET, algorithm="HS256")
    link = f"{APP_URL}/auth?token={token}"

    await update.message.reply_text(
        f"Here's your dashboard link (valid for 5 minutes):\n\n{link}"
    )


async def handle_message(update: Update, context) -> None:
    """Handle incoming text messages."""
    user_id = str(update.effective_user.id)
    chat_id = str(update.effective_chat.id)

    message_text = update.message.text
    await update.message.reply_text("Processing...")

    # Send to Claude
    success, logs, raw_dicts, error = await extract_log(message_text)

    if not success:
        await update.message.reply_text(f"Error: {error}")
        return

    # Filter out unknown types
    valid = [(log, data) for log, data in zip(logs, raw_dicts) if log.type != "unknown"]

    if not valid:
        await update.message.reply_text(
            "I couldn't classify that as a meal, workout, weight, or wellness entry. "
            "Try rephrasing."
        )
        return

    # Send a confirmation message for each entry
    for log, data in valid:
        pending = create_pending_log(
            user_id=user_id,
            telegram_chat_id=chat_id,
            log_type=log.type,
            payload=data,
        )
        pending_id = pending["id"]

        confirmation_text = format_confirmation(log.type, data)
        confirmation_text += "\n\nConfirm save?"

        keyboard = InlineKeyboardMarkup([
            [
                InlineKeyboardButton("Yes", callback_data=f"confirm:{pending_id}"),
                InlineKeyboardButton("No", callback_data=f"reject:{pending_id}"),
            ]
        ])

        await update.message.reply_text(confirmation_text, reply_markup=keyboard)


async def feedback_command(update: Update, context) -> None:
    """Handle /feedback command — store user feedback."""
    message = " ".join(context.args) if context.args else ""
    if not message:
        await update.message.reply_text(
            "Please include your feedback after the command.\n"
            "Example: /feedback Add a weekly summary feature"
        )
        return

    user_id = str(update.effective_user.id)
    client = get_client()
    client.table("feedback").insert({
        "user_id": user_id,
        "message": message,
    }).execute()

    await update.message.reply_text("Thanks for the feedback!")


async def handle_callback(update: Update, context) -> None:
    """Handle Yes/No button presses."""
    query = update.callback_query
    await query.answer()

    action, pending_id = query.data.split(":", 1)

    if action == "confirm":
        result = confirm_log(pending_id)
        if result:
            await query.edit_message_text(query.message.text + "\n\nSaved!")
        else:
            await query.edit_message_text(query.message.text + "\n\nEntry not found or already processed.")
    elif action == "reject":
        delete_pending_log(pending_id)
        await query.edit_message_text(query.message.text + "\n\nDiscarded.")


def main():
    """Start the bot with polling (for standalone local dev)."""
    token = os.getenv("TELEGRAM_BOT_TOKEN", "")
    if not token:
        logger.error("TELEGRAM_BOT_TOKEN not set")
        return

    app = Application.builder().token(token).build()

    app.add_handler(CommandHandler("start", start_command))
    app.add_handler(CommandHandler("login", login_command))
    app.add_handler(CommandHandler("feedback", feedback_command))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    app.add_handler(CallbackQueryHandler(handle_callback))

    logger.info("Bot starting with polling...")
    app.run_polling()


if __name__ == "__main__":
    main()
