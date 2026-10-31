from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import logger, setup_logging
from app.db.session import check_db_connection, engine


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Application lifespan context manager handling startup and shutdown events."""
    setup_logging()
    logger.info("Starting up %s (v%s) in '%s' mode...", settings.PROJECT_NAME, settings.VERSION, settings.APP_ENV)

    # Verify database connectivity on startup
    db_ok = await check_db_connection()
    if db_ok:
        logger.info("PostgreSQL database connection established successfully.")
    else:
        logger.warning("PostgreSQL database connection could not be established during startup.")

    yield

    # Clean up database connection pool on shutdown
    logger.info("Shutting down %s...", settings.PROJECT_NAME)
    await engine.dispose()
    logger.info("Database engine connections closed.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Register custom and global exception handlers
register_exception_handlers(app)

# Configure CORS middleware
origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount versioned API routes
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get(
    "/",
    tags=["Root"],
    summary="Root Service Status",
    description="Basic welcome and status endpoint for PressLens API.",
    status_code=status.HTTP_200_OK,
)
async def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "version": settings.VERSION,
        "environment": settings.APP_ENV,
        "status": "running",
        "documentation": {
            "swagger": "/docs",
            "redoc": "/redoc",
            "openapi": f"{settings.API_V1_STR}/openapi.json",
        },
    }
