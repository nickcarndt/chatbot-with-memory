import os
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv
from .api.v1.router import router as api_router
from .db.session import Base, engine
from .core.logging_config import configure_logging, get_logger
from .core.middleware import RequestIDMiddleware

# Configure logging first
configure_logging()
logger = get_logger(__name__)

load_dotenv()

FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "*")

# Rate limiting: 10 requests per minute per IP
limiter = Limiter(key_func=get_remote_address)


def create_app() -> FastAPI:
    app = FastAPI(title="Chatbot with Memory API", version="0.1.0")
    
    # Add request ID middleware (must be first to capture all requests)
    app.add_middleware(RequestIDMiddleware)
    
    # Add rate limiting
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[FRONTEND_ORIGIN] if FRONTEND_ORIGIN != "*" else ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        """
        Global exception handler that logs unhandled exceptions with request_id.
        """
        request_id = getattr(request.state, "request_id", None)
        
        logger.exception(
            "unhandled_exception",
            request_id=request_id,
            method=request.method,
            path=request.url.path,
            error_type=type(exc).__name__,
            error_message=str(exc),
        )
        
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": "Internal server error",
                "request_id": request_id,
            },
            headers={"X-Request-ID": request_id} if request_id else {},
        )

    @app.get("/health")
    def health_check():
        return {"status": "healthy", "service": "chatbot-backend"}

    @app.on_event("startup")
    def on_startup() -> None:
        Base.metadata.create_all(bind=engine)
        logger.info("application_started", env=os.getenv("ENV", "development"))

    app.include_router(api_router, prefix="/api/v1")
    return app


