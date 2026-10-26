"""FastAPI application entry point for the AI API."""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db.session import create_db_and_tables, engine
from .routes.conversations import router as conversations_router
from .routes.documents import router as documents_router


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncGenerator[None, None]:
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

for router in (documents_router, conversations_router):
    app.include_router(router, prefix=settings.api_v1_prefix)
