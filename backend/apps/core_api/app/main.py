"""FastAPI application entry point for the Core API."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db.session import create_db_and_tables, engine
from .routes.auth import router as auth_router
from .routes.chat import router as chat_router
from .routes.payments import router as payments_router
from .routes.rooms import router as rooms_router


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    """Initialize database tables at startup and release connections at shutdown."""
    await create_db_and_tables()
    try:
        yield
        
    finally:
        await engine.dispose()


app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in (auth_router, rooms_router, chat_router, payments_router):
    app.include_router(router, prefix=settings.api_v1_prefix)
