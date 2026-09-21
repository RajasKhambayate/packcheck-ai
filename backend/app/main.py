import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import engine, Base
from app.routers import auth, scan, products, dashboard, reports

logging.basicConfig(level=logging.INFO)

# Auto-create tables on boot (fine for SQLite/dev & first-run Postgres;
# for ongoing schema changes in production, wire up Alembic migrations).
Base.metadata.create_all(bind=engine)

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.REPORT_DIR, exist_ok=True)

app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered Legal Metrology (Packaged Commodities) Rules, 2011 "
                 "compliance & product label verification platform — SIH 2026, PS #26034.",
    version="1.0.0",
)

origins = ["*"] if settings.CORS_ORIGINS == "*" else settings.CORS_ORIGINS.split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="app/static"), name="static")

app.include_router(auth.router)
app.include_router(scan.router)
app.include_router(products.router)
app.include_router(dashboard.router)
app.include_router(reports.router)


@app.get("/api/health", tags=["Health"])
def health_check():
    return {"status": "ok", "app": settings.APP_NAME}


@app.get("/", tags=["Health"])
def root():
    return {
        "message": "PackCheck AI backend is running.",
        "docs": "/docs",
        "health": "/api/health",
    }
