from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
from fastapi import APIRouter, Header, HTTPException, status

from ..settings import settings

router = APIRouter()


def _require_admin_key(x_admin_key: str | None) -> None:
    configured_key = settings.admin_dashboard_key.strip()
    if not configured_key:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="admin_key_not_configured")
    if not x_admin_key or x_admin_key.strip() != configured_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid_admin_key")


def _to_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


@router.get("/admin/analytics")
async def analytics_summary(x_admin_key: str | None = Header(default=None)) -> dict[str, Any]:
    _require_admin_key(x_admin_key)

    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="supabase_not_configured")

    headers = {
        "apikey": settings.supabase_service_role_key,
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
    }
    base = settings.supabase_url.rstrip("/")
    sessions_url = f"{base}/rest/v1/analytics_sessions?select=*&order=started_at.desc&limit=2000"
    events_url = f"{base}/rest/v1/analytics_events?select=*&order=created_at.desc&limit=1000"

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            sessions_res = await client.get(sessions_url, headers=headers)
            events_res = await client.get(events_url, headers=headers)
        sessions_res.raise_for_status()
        events_res.raise_for_status()
        sessions = sessions_res.json()
        events = events_res.json()
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"supabase_query_failed:{exc}") from exc

    now = datetime.now(timezone.utc)
    today_start = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)

    completed = [s for s in sessions if isinstance(s.get("duration_seconds"), int)]
    active_sessions = sum(1 for s in sessions if not s.get("ended_at"))
    unique_visitors = len({s.get("visitor_id") for s in sessions if s.get("visitor_id")})
    sessions_today = sum(1 for s in sessions if (_to_dt(s.get("started_at")) or now) >= today_start)
    avg_session_duration_sec = round(sum(s.get("duration_seconds", 0) for s in completed) / len(completed)) if completed else 0

    fullscreen_session_ids = {e.get("session_id") for e in events if e.get("event_name") == "fullscreen_enter" and e.get("session_id")}
    audio_session_ids = {e.get("session_id") for e in events if e.get("event_name") == "audio_on" and e.get("session_id")}
    fullscreen_enter_rate = round((len(fullscreen_session_ids) / len(completed)) * 100) if completed else 0
    ambient_usage_rate = round((len(audio_session_ids) / len(completed)) * 100) if completed else 0

    event_theme_by_session: dict[str, str] = {}
    for event in events:
        sid = event.get("session_id")
        if sid and event.get("event_name") == "theme_view" and event.get("theme_name"):
            event_theme_by_session[sid] = event["theme_name"]

    def infer_theme(session: dict[str, Any]) -> str:
        sid = session.get("id")
        if sid in event_theme_by_session:
            return event_theme_by_session[sid]
        landing = (session.get("landing_path") or "").lower()
        return "aurora-night" if "aurora" in landing else "night-sky"

    theme_counts = Counter()
    device_counts = Counter()
    duration_by_theme: dict[str, list[int]] = defaultdict(list)
    visitor_sessions = Counter()

    for session in sessions:
        theme = infer_theme(session)
        theme_counts[theme] += 1
        device_counts[session.get("device_type") or "desktop"] += 1
        if isinstance(session.get("duration_seconds"), int):
            duration_by_theme[theme].append(session["duration_seconds"])
        visitor_id = session.get("visitor_id")
        if visitor_id:
            visitor_sessions[visitor_id] += 1

    average_by_theme = {k: round(sum(v) / len(v)) if v else 0 for k, v in duration_by_theme.items()}
    return_visitors = sum(1 for c in visitor_sessions.values() if c > 1)
    return_visit_rate = round((return_visitors / unique_visitors) * 100) if unique_visitors else 0

    longest_sessions = sorted(completed, key=lambda s: s.get("duration_seconds", 0), reverse=True)[:5]
    longest_sessions_payload = [
        {
            "id": s.get("id"),
            "themeId": infer_theme(s),
            "durationSec": s.get("duration_seconds", 0),
            "startedAt": s.get("started_at"),
        }
        for s in longest_sessions
    ]

    timeline = []
    for offset in range(12):
        bucket_start = now - timedelta(hours=(11 - offset))
        bucket_end = bucket_start + timedelta(hours=1)
        count = 0
        for session in sessions:
            started = _to_dt(session.get("started_at"))
            if started and bucket_start <= started < bucket_end:
                count += 1
        timeline.append({"label": bucket_start.strftime("%H:%M"), "count": count})

    recent_events = [
        {
            "id": e.get("id"),
            "eventName": e.get("event_name"),
            "themeName": e.get("theme_name"),
            "path": e.get("path"),
            "createdAt": e.get("created_at"),
        }
        for e in events[:25]
    ]

    return {
        "mode": "supabase-secure",
        "fallbackReason": "",
        "activeSessions": active_sessions,
        "totalVisitors": unique_visitors,
        "sessionsToday": sessions_today,
        "avgSessionDurationSec": avg_session_duration_sec,
        "fullscreenEnterRate": fullscreen_enter_rate,
        "ambientUsageRate": ambient_usage_rate,
        "returnVisitRate": return_visit_rate,
        "totalSessions": len(completed),
        "themeCounts": dict(theme_counts),
        "averageByTheme": average_by_theme,
        "deviceCounts": dict(device_counts),
        "longestSessions": longest_sessions_payload,
        "sessionTimeline": timeline,
        "recentEvents": recent_events,
    }

