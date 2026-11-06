import json
import logging
import time
import uuid
from collections.abc import Callable
from pathlib import Path
from typing import Annotated, Literal

from fastapi import FastAPI, Header, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.models import Review, ReviewRequest
from app.providers import DemoProvider, LLM
from app.review_service import MAX_DIFF_CHARS, TIMEOUT_SECONDS, ReviewError, ReviewService

STATIC = Path(__file__).resolve().parent / "static"
logger = logging.getLogger("ai_review.requests")


def create_app(
    provider_factory: Callable[[str], LLM] | None = None,
    timeout_seconds: float = TIMEOUT_SECONDS,
) -> FastAPI:
    if not 0 < timeout_seconds <= TIMEOUT_SECONDS:
        raise ValueError("deadline must be in (0, 10] seconds")
    factory = provider_factory or DemoProvider
    api = FastAPI(title="AI Review · Practice 5", version="1.0.0")

    @api.middleware("http")
    async def metadata(request: Request, call_next):
        request.state.request_id = str(uuid.uuid4())
        start = time.monotonic()
        response = await call_next(request)
        response.headers["X-Request-ID"] = request.state.request_id
        logger.info(json.dumps({
            "request_id": request.state.request_id,
            "duration": round((time.monotonic() - start) * 1000, 3),
            "status": response.status_code,
        }))
        return response

    def error_response(request: Request, status: int, code: str, message: str):
        return JSONResponse(status_code=status, content={
            "error": {"code": code, "message": message},
            "request_id": request.state.request_id,
        })

    @api.exception_handler(ReviewError)
    async def review_error(request: Request, error: ReviewError):
        return error_response(request, error.status, error.code, error.message)

    @api.exception_handler(RequestValidationError)
    async def invalid_request(request: Request, error: RequestValidationError):
        # Default FastAPI errors may contain the original input (including secrets).
        return error_response(request, 422, "invalid_request", "Проверьте JSON, поле diff и demo-сценарий.")

    @api.get("/health")
    async def health():
        return {"status": "ok"}

    @api.get("/api/config")
    async def config():
        return {"demo": True, "timeout_seconds": timeout_seconds, "max_diff_chars": MAX_DIFF_CHARS}

    @api.post("/api/reviews", response_model=Review)
    async def create_review(
        payload: ReviewRequest,
        x_demo_scenario: Annotated[Literal["normal", "slow", "error", "invalid"], Header()] = "normal",
    ):
        return await ReviewService(factory(x_demo_scenario), timeout_seconds).review(payload.diff)

    @api.get("/", include_in_schema=False)
    async def index():
        return FileResponse(STATIC / "index.html")

    api.mount("/static", StaticFiles(directory=STATIC), name="static")
    return api


app = create_app()
