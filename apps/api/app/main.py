"""FastAPI application entrypoint."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.config import settings
from app.routers import audit_logs, dashboard, purchase_requests
from app.schemas import HealthResponse
from app.seed import seed_if_empty

logging.basicConfig(level=settings.app_log_level.upper())
logger = logging.getLogger("bcsuite")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting BC Suite API (env=%s, bc_mode=%s)", settings.app_env, settings.bc_mode)
    seed_if_empty()
    yield
    logger.info("BC Suite API shutting down")


app = FastAPI(
    title="Business Central Integration Suite API",
    description=(
        "REST API for the Business-Central-Integration-Suite project. "
        "Implements the Purchase Request → Approval → Sync-to-BC flow that mirrors "
        "the AL extension in extensions/bc-procurement."
    ),
    version=__version__,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(purchase_requests.router)
app.include_router(audit_logs.router)
app.include_router(dashboard.router)


@app.get("/", include_in_schema=False)
def root() -> dict[str, str]:
    return {
        "name": "Business Central Integration Suite API",
        "version": __version__,
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health", response_model=HealthResponse, tags=["health"])
def health() -> HealthResponse:
    return HealthResponse(status="ok", bc_mode=settings.bc_mode, version=__version__)
