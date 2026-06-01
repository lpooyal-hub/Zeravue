from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import admin, apod, sky
from .settings import settings

app = FastAPI(title="Zeravue API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(apod.router, prefix="/api", tags=["NASA"])
app.include_router(sky.router, prefix="/api/sky", tags=["Sky"])
app.include_router(admin.router, prefix="/api", tags=["Admin"])


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
