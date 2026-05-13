from pydantic import BaseModel, Field
from fastapi import APIRouter

from ..services.observability import calculate_visible_zodiac
from ..services.scene_builder import build_star_scene

router = APIRouter()


class SignInput(BaseModel):
    id: str
    raHours: float = Field(ge=0, le=24)
    decDegrees: float = Field(ge=-90, le=90)


class VisibleSkyRequest(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    signs: list[SignInput]


class SceneSkyRequest(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    observedAt: str | None = None
    limitingMagnitude: float = Field(default=4.8, ge=-2, le=6)
    maxStars: int = Field(default=4500, ge=100, le=10000)


@router.post("/visible")
async def visible_zodiac(payload: VisibleSkyRequest):
    return calculate_visible_zodiac(
        latitude=payload.latitude,
        longitude=payload.longitude,
        signs=[sign.model_dump() for sign in payload.signs],
    )


@router.post("/scene")
async def sky_scene(payload: SceneSkyRequest):
    return build_star_scene(
        latitude=payload.latitude,
        longitude=payload.longitude,
        observed_at=payload.observedAt,
        limiting_magnitude=payload.limitingMagnitude,
        max_stars=payload.maxStars,
    )
