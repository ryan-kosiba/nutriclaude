from fastapi import APIRouter

router = APIRouter()


@router.post("/confirm")
async def confirm_log():
    # TODO: Move from pending_logs to appropriate table
    return {"status": "not implemented"}
