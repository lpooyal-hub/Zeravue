import csv
import gzip
from datetime import datetime, timezone
from functools import lru_cache
from math import cos, radians, sin
from pathlib import Path

from astropy import units as u
from astropy.coordinates import AltAz, EarthLocation, SkyCoord
from astropy.time import Time
from astropy.utils import iers

from ..data.bright_stars import BRIGHT_STARS, CONSTELLATION_LINES

iers.conf.auto_download = False
iers.conf.auto_max_age = None

DEFAULT_LIMITING_MAGNITUDE = 4.8
DEFAULT_MAX_STARS = 4500
SCENE_RADIUS = 10.0
CONSTELLATION_MIN_ALTITUDE = 8.0
CONSTELLATION_MIN_STARS = 2
HYG_CATALOG_PATH = Path("/app/data/hygdata_v42.csv.gz")
CONSTELLATION_NAMES = {
    "And": "Andromeda",
    "Ant": "Antlia",
    "Aps": "Apus",
    "Aqr": "Aquarius",
    "Aql": "Aquila",
    "Ara": "Ara",
    "Ari": "Aries",
    "Aur": "Auriga",
    "Boo": "Bootes",
    "Cae": "Caelum",
    "Cam": "Camelopardalis",
    "Cap": "Capricornus",
    "Car": "Carina",
    "Cas": "Cassiopeia",
    "Cen": "Centaurus",
    "Cep": "Cepheus",
    "Cet": "Cetus",
    "Cha": "Chamaeleon",
    "Cir": "Circinus",
    "CMa": "Canis Major",
    "CMi": "Canis Minor",
    "Cnc": "Cancer",
    "Col": "Columba",
    "Com": "Coma Berenices",
    "CrA": "Corona Australis",
    "CrB": "Corona Borealis",
    "Crt": "Crater",
    "Cru": "Crux",
    "Crv": "Corvus",
    "CVn": "Canes Venatici",
    "Cyg": "Cygnus",
    "Del": "Delphinus",
    "Dor": "Dorado",
    "Dra": "Draco",
    "Equ": "Equuleus",
    "Eri": "Eridanus",
    "For": "Fornax",
    "Gem": "Gemini",
    "Gru": "Grus",
    "Her": "Hercules",
    "Hor": "Horologium",
    "Hya": "Hydra",
    "Hyi": "Hydrus",
    "Ind": "Indus",
    "Lac": "Lacerta",
    "Leo": "Leo",
    "Lep": "Lepus",
    "Lib": "Libra",
    "LMi": "Leo Minor",
    "Lup": "Lupus",
    "Lyn": "Lynx",
    "Lyr": "Lyra",
    "Men": "Mensa",
    "Mic": "Microscopium",
    "Mon": "Monoceros",
    "Mus": "Musca",
    "Nor": "Norma",
    "Oct": "Octans",
    "Oph": "Ophiuchus",
    "Ori": "Orion",
    "Pav": "Pavo",
    "Peg": "Pegasus",
    "Per": "Perseus",
    "Phe": "Phoenix",
    "Pic": "Pictor",
    "PsA": "Piscis Austrinus",
    "Psc": "Pisces",
    "Pup": "Puppis",
    "Pyx": "Pyxis",
    "Ret": "Reticulum",
    "Scl": "Sculptor",
    "Sco": "Scorpius",
    "Sct": "Scutum",
    "Ser": "Serpens",
    "Sex": "Sextans",
    "Sge": "Sagitta",
    "Sgr": "Sagittarius",
    "Tau": "Taurus",
    "Tel": "Telescopium",
    "TrA": "Triangulum Australe",
    "Tri": "Triangulum",
    "Tuc": "Tucana",
    "UMa": "Ursa Major",
    "UMi": "Ursa Minor",
    "Vel": "Vela",
    "Vir": "Virgo",
    "Vol": "Volans",
    "Vul": "Vulpecula",
}


def build_star_scene(
    latitude: float,
    longitude: float,
    observed_at: str | None,
    limiting_magnitude: float,
    max_stars: int,
):
    timestamp = _parse_observed_at(observed_at)
    location = EarthLocation(lat=latitude * u.deg, lon=longitude * u.deg)
    frame = AltAz(obstime=timestamp, location=location)

    catalog = load_hyg_catalog()
    filtered = [star for star in catalog if star["magnitude"] <= limiting_magnitude][:max_stars]
    coords = SkyCoord(
        ra=[star["ra_hours"] for star in filtered] * u.hourangle,
        dec=[star["dec_degrees"] for star in filtered] * u.deg,
        frame="icrs",
    ).transform_to(frame)

    stars = []

    for star, transformed in zip(filtered, coords):
        altitude = float(transformed.alt.degree)
        azimuth = float(transformed.az.degree)

        if altitude <= 0:
            continue

        x, y, z = _to_cartesian(altitude, azimuth)
        star_payload = {
            "id": star["id"],
            "name": star["name"],
            "constellation": star["constellation"],
            "magnitude": star["magnitude"],
            "color": star["color"],
            "altitude": round(altitude, 2),
            "azimuth": round(azimuth, 2),
            "visible": True,
            "x": round(x, 4),
            "y": round(y, 4),
            "z": round(z, 4),
            "size": round(max(0.08, 0.6 - star["magnitude"] * 0.065), 3),
            "catalog": "HYG v4.2",
        }
        stars.append(star_payload)

    stars_by_id = {star["id"]: star for star in stars}
    candidate_star_ids = {
        star["id"]
        for star in stars
        if star["constellation"] != "Unknown" and star["altitude"] >= CONSTELLATION_MIN_ALTITUDE
    }
    candidate_lines = _build_constellation_lines(stars, candidate_star_ids)
    visible_constellations = _build_visible_constellations(stars, candidate_lines)
    lines = [
        line
        for line in candidate_lines
        if _line_constellation(line, stars_by_id) in visible_constellations
    ]

    return {
        "observer": {
            "latitude": latitude,
            "longitude": longitude,
            "observedAt": timestamp.isot,
            "limitingMagnitude": limiting_magnitude,
            "maxStars": max_stars,
        },
        "summary": {
            "catalog": "HYG v4.2",
            "visibleStars": len(stars),
            "visibleConstellations": visible_constellations,
        },
        "stars": stars,
        "lines": lines,
    }


@lru_cache(maxsize=1)
def load_hyg_catalog():
    if not HYG_CATALOG_PATH.exists():
        raise FileNotFoundError(f"HYG catalog file not found: {HYG_CATALOG_PATH}")

    stars = []

    with gzip.open(HYG_CATALOG_PATH, "rt", encoding="utf-8", newline="") as file:
        reader = csv.DictReader(file)
        for row in reader:
            try:
                magnitude = float(row["mag"])
                ra_hours = float(row["ra"])
                dec_degrees = float(row["dec"])
            except (KeyError, TypeError, ValueError):
                continue

            if magnitude > 6.2:
                continue

            constellation = _normalize_constellation(row.get("con"))
            if _is_filtered_out(row, magnitude):
                continue
            stars.append(
                {
                    "id": row.get("id") or f"hyg-{len(stars)}",
                    "name": _build_name(row, constellation),
                    "constellation": constellation,
                    "magnitude": magnitude,
                    "ra_hours": ra_hours,
                    "dec_degrees": dec_degrees,
                    "color": _color_from_ci(row.get("ci")),
                }
            )

    stars.sort(key=lambda star: star["magnitude"])
    return stars


def _build_constellation_lines(stars: list[dict], visible_ids: set[str]):
    bright_name_by_id = {star["id"]: star["name"] for star in BRIGHT_STARS}
    stars_by_name = {star["name"].lower(): star for star in stars}
    lines = []

    for from_id, to_id in CONSTELLATION_LINES:
        from_name = bright_name_by_id.get(from_id, "").lower()
        to_name = bright_name_by_id.get(to_id, "").lower()
        from_star = stars_by_name.get(from_name)
        to_star = stars_by_name.get(to_name)

        if not from_star or not to_star:
            continue

        if from_star["id"] not in visible_ids or to_star["id"] not in visible_ids:
            continue

        lines.append({"from": from_star["id"], "to": to_star["id"]})

    return lines


def _build_visible_constellations(stars: list[dict], lines: list[dict]) -> list[str]:
    star_counts: dict[str, int] = {}
    line_counts: dict[str, int] = {}
    stars_by_id = {star["id"]: star for star in stars}

    for star in stars:
        constellation = star["constellation"]
        if constellation == "Unknown" or star["altitude"] < CONSTELLATION_MIN_ALTITUDE:
            continue
        star_counts[constellation] = star_counts.get(constellation, 0) + 1

    for line in lines:
        constellation = _line_constellation(line, stars_by_id)
        if constellation == "Unknown":
            continue
        line_counts[constellation] = line_counts.get(constellation, 0) + 1

    visible = []
    for constellation, count in star_counts.items():
        if count < CONSTELLATION_MIN_STARS:
            continue
        if line_counts.get(constellation, 0) < 1:
            continue
        visible.append(constellation)

    return sorted(visible)


def _line_constellation(line: dict, stars_by_id: dict[str, dict]) -> str:
    from_star = stars_by_id.get(line["from"])
    to_star = stars_by_id.get(line["to"])

    if not from_star or not to_star:
        return "Unknown"
    if from_star["constellation"] != to_star["constellation"]:
        return "Unknown"

    return from_star["constellation"]


def _build_name(row: dict, constellation: str):
    proper = (row.get("proper") or "").strip()
    if proper:
        return proper

    bayer = (row.get("bayer") or "").strip()
    flam = (row.get("flam") or "").strip()
    hd = (row.get("hd") or "").strip()
    hip = (row.get("hip") or "").strip()

    if bayer and constellation != "Unknown":
        return f"{bayer} {constellation}"
    if flam and constellation != "Unknown":
        return f"{flam} {constellation}"
    if hd:
        return f"HD {hd}"
    if hip:
        return f"HIP {hip}"

    return f"HYG {row.get('id', '?')}"


def _normalize_constellation(code: str | None):
    cleaned = (code or "").strip()
    if not cleaned:
        return "Unknown"

    return CONSTELLATION_NAMES.get(cleaned, cleaned)


def _is_filtered_out(row: dict, magnitude: float):
    proper = (row.get("proper") or "").strip().lower()
    if proper == "sol":
        return True

    if magnitude < -5:
        return True

    return False


def _color_from_ci(ci_value: str | None):
    try:
        ci = float(ci_value)
    except (TypeError, ValueError):
        ci = 0.65

    ci = max(-0.4, min(2.0, ci))

    if ci < 0.0:
        return "#b9d2ff"
    if ci < 0.4:
        return "#dce7ff"
    if ci < 0.8:
        return "#fff2cf"
    if ci < 1.2:
        return "#ffd29f"
    return "#ffb38d"


def _parse_observed_at(observed_at: str | None) -> Time:
    if observed_at:
        return Time(observed_at)

    return Time(datetime.now(timezone.utc))


def _to_cartesian(altitude: float, azimuth: float) -> tuple[float, float, float]:
    alt = radians(altitude)
    az = radians(azimuth)
    x = SCENE_RADIUS * sin(az) * cos(alt)
    y = SCENE_RADIUS * sin(alt)
    z = -SCENE_RADIUS * cos(az) * cos(alt)
    return x, y, z
