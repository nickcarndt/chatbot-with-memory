import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv
from .api.v1.router import router as api_router
from .db.session import Base, engine


load_dotenv()

FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "*")

# Rate limiting: 10 requests per minute per IP
limiter = Limiter(key_func=get_remote_address)


def create_app() -> FastAPI:
    app = FastAPI(title="Chatbot with Memory API", version="0.1.0")
    
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

    @app.get("/health")
    def health_check():
        return {"status": "healthy", "service": "chatbot-backend"}

    @app.on_event("startup")
    def on_startup() -> None:
        Base.metadata.create_all(bind=engine)

    app.include_router(api_router, prefix="/api/v1")
    return app


