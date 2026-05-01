from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from core.config import settings
import database
from routers import auth, users, yearbook, announcements, connections, admin, notifications
import os
import time
import logging
from starlette.requests import Request
from starlette.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from pydantic import BaseModel, EmailStr, Field, HttpUrl, ConfigDict
from datetime import datetime

# Configure production logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

@app.on_event("startup")
async def ensure_runtime_schema():
    try:
        await database.ensure_security_columns()
    except Exception:
        logger.warning("Could not verify onboarding/security columns at startup", exc_info=True)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000
    logger.info(
        f"Method: {request.method} Path: {request.url.path} "
        f"Status: {response.status_code} Duration: {process_time:.2f}ms"
    )
    return response

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    origin = request.headers.get("origin")
    headers = {}
    if origin:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    
    error_details = str(exc)
    if isinstance(exc, SQLAlchemyError):
        return JSONResponse(
            status_code=500,
            content={
                "detail": "A database error occurred.",
                "debug": error_details if settings.DEBUG else None
            },
            headers=headers
        )
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
            headers=headers
        )
    error_details = traceback.format_exc()
    logger.error(f"Internal Server Error: {exc}\n{error_details}")
    
    debug_mode = getattr(settings, "DEBUG", False)
    
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error. Our team has been notified.",
            "debug": error_details if debug_mode else None
        },
        headers=headers
    )

# CORS Configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Routes
app.include_router(auth.router, prefix=settings.API_V1_STR, tags=["auth"])
app.include_router(users.router, prefix=settings.API_V1_STR, tags=["users"])
app.include_router(admin.router, prefix=settings.API_V1_STR, tags=["admin"])
app.include_router(yearbook.router, prefix=settings.API_V1_STR, tags=["yearbook"])
app.include_router(connections.router, prefix=settings.API_V1_STR, tags=["connections"])
app.include_router(announcements.router, prefix=settings.API_V1_STR, tags=["announcements"])
app.include_router(notifications.router, prefix=settings.API_V1_STR, tags=["notifications"])

# Static files for uploads
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)
    os.makedirs(os.path.join(UPLOAD_DIR, "avatars"), exist_ok=True)
    os.makedirs(os.path.join(UPLOAD_DIR, "yearbook"), exist_ok=True)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.get("/")
async def read_root():
    return {
        "project": settings.PROJECT_NAME,
        "version": "1.0.0",
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }
