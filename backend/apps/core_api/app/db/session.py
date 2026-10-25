from collections.abc import AsyncIterator
from pathlib import Path
from typing import Annotated

from fastapi import Depends
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from ..config import BACKEND_ROOT, settings


class Base(DeclarativeBase):
    pass


def _database_url() -> str:
    configured_url = make_url(settings.database_url)
    if configured_url.get_backend_name() != "sqlite":
        return configured_url.render_as_string(hide_password=False)

    database = configured_url.database
    if database and database != ":memory:":
        database_path = Path(database)
        if not database_path.is_absolute():
            database_path = BACKEND_ROOT / database_path
        database_path.parent.mkdir(parents=True, exist_ok=True)
        configured_url = configured_url.set(database=str(database_path))

    return configured_url.render_as_string(hide_password=False)


engine = create_async_engine(_database_url(), echo=settings.debug)
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as session:
        yield session


db_dependency = Annotated[AsyncSession, Depends(get_db)]


async def create_db_and_tables() -> None:
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
