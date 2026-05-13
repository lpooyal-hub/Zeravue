from datetime import datetime, timezone
from math import acos, asin, cos, degrees, radians, sin

MIN_TRIG_DENOMINATOR = 1e-12


def calculate_visible_zodiac(latitude: float, longitude: float, signs: list[dict]):
    local_sidereal_hours = get_local_sidereal_time(datetime.now(timezone.utc), longitude)
    results = []

    for sign in signs:
        hour_angle_degrees = normalize_degrees((local_sidereal_hours - sign["raHours"]) * 15)
        signed_hour_angle = hour_angle_degrees - 360 if hour_angle_degrees > 180 else hour_angle_degrees
        altitude = get_altitude(latitude, sign["decDegrees"], signed_hour_angle)
        azimuth = get_azimuth(latitude, sign["decDegrees"], signed_hour_angle, altitude)

        results.append(
            {
                "id": sign["id"],
                "altitude": round(altitude),
                "azimuth": round(azimuth),
                "direction": get_compass_direction(azimuth),
                "visible": altitude > 8,
                "quality": get_viewing_quality(altitude),
            }
        )

    return sorted(results, key=lambda item: item["altitude"], reverse=True)


def get_local_sidereal_time(date: datetime, longitude: float) -> float:
    unix_days = date.timestamp() / 86400
    julian_date = unix_days + 2440587.5
    days_since_j2000 = julian_date - 2451545.0
    greenwich_sidereal_degrees = 280.46061837 + 360.98564736629 * days_since_j2000
    return normalize_degrees(greenwich_sidereal_degrees + longitude) / 15


def get_altitude(latitude: float, declination: float, hour_angle: float) -> float:
    lat = radians(latitude)
    dec = radians(declination)
    ha = radians(hour_angle)
    sin_altitude = sin(dec) * sin(lat) + cos(dec) * cos(lat) * cos(ha)
    clamped = max(-1, min(1, sin_altitude))
    return degrees(asin(clamped))


def get_azimuth(latitude: float, declination: float, hour_angle: float, altitude: float) -> float:
    lat = radians(latitude)
    dec = radians(declination)
    ha = radians(hour_angle)
    alt = radians(altitude)
    denominator = cos(alt) * cos(lat)

    if abs(denominator) < MIN_TRIG_DENOMINATOR:
        return 0

    cos_azimuth = (sin(dec) - sin(alt) * sin(lat)) / denominator
    clamped = max(-1, min(1, cos_azimuth))
    azimuth = degrees(acos(clamped))

    if sin(ha) > 0:
        azimuth = 360 - azimuth

    return normalize_degrees(azimuth)


def normalize_degrees(value: float) -> float:
    return value % 360


def get_compass_direction(azimuth: float) -> str:
    directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
    return directions[round(azimuth / 45) % 8]


def get_viewing_quality(altitude: float) -> str:
    if altitude >= 55:
        return "excellent"
    if altitude >= 30:
        return "good"
    if altitude >= 8:
        return "low"
    return "below"
