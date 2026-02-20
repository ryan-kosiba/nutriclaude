from fastapi import APIRouter

router = APIRouter()


@router.post("/log")
async def handle_telegram_webhook():
    # TODO: Parse Telegram message, send to Claude, store in pending_logs
    return {"status": "not implemented"}
