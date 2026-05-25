import { isSupabaseConfigured, supabase } from "./supabaseClient.js";

const STORE_KEY = "zeravue-analytics-v1";
const VISITOR_KEY = "zeravue-visitor-id";

const runtimeState = {
  mode: isSupabaseConfigured ? "supabase" : "local",
  lastError: "",
  activeSession: null
};

function safeParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function readSessions() {
  const raw = window.localStorage.getItem(STORE_KEY);
  const sessions = safeParse(raw, []);
  return Array.isArray(sessions) ? sessions : [];
}

function writeSessions(sessions) {
  window.localStorage.setItem(STORE_KEY, JSON.stringify(sessions.slice(-2000)));
}

function detectDeviceType() {
  const ua = navigator.userAgent || "";
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    return "tablet";
  }
  if (/mobi|android|iphone|ipod/i.test(ua)) {
    return "mobile";
  }
  return "desktop";
}

function detectBrowser() {
  const ua = navigator.userAgent || "";
  if (/edg/i.test(ua)) return "edge";
  if (/chrome|crios/i.test(ua)) return "chrome";
  if (/safari/i.test(ua) && !/chrome|crios|android/i.test(ua)) return "safari";
  if (/firefox|fxios/i.test(ua)) return "firefox";
  return "other";
}

function detectOs() {
  const ua = navigator.userAgent || "";
  if (/windows/i.test(ua)) return "windows";
  if (/mac os/i.test(ua)) return "macos";
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod|ios/i.test(ua)) return "ios";
  if (/linux/i.test(ua)) return "linux";
  return "other";
}

export function getVisitorId() {
  const existing = window.localStorage.getItem(VISITOR_KEY);
  if (existing) {
    return existing;
  }
  const id = `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  window.localStorage.setItem(VISITOR_KEY, id);
  return id;
}

function createLocalSession({ themeId, routePath }) {
  const sessions = readSessions();
  const visitorId = getVisitorId();
  const priorVisits = sessions.filter((session) => session.visitorId === visitorId).length;
  const id = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  const session = {
    id,
    visitorId,
    themeId: themeId || "unknown",
    routePath: routePath || "/",
    deviceType: detectDeviceType(),
    browser: detectBrowser(),
    os: detectOs(),
    referrer: document.referrer || "",
    startedAt: new Date().toISOString(),
    endedAt: null,
    durationSec: null,
    fullscreenEnters: 0,
    ambientUsed: false,
    isReturnVisit: priorVisits > 0,
    events: []
  };
  sessions.push(session);
  writeSessions(sessions);
  return session;
}

function mutateLocalSession(sessionId, updater) {
  if (!sessionId) {
    return null;
  }
  const sessions = readSessions();
  const index = sessions.findIndex((session) => session.id === sessionId);
  if (index < 0) {
    return null;
  }
  sessions[index] = updater(sessions[index]);
  writeSessions(sessions);
  return sessions[index];
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function summarizeLocal() {
  const sessions = readSessions();
  const completed = sessions.filter((session) => typeof session.durationSec === "number");
  const activeSessions = sessions.filter((session) => !session.endedAt).length;
  const avgSessionDurationSec = Math.round(average(completed.map((session) => session.durationSec)));
  const fullscreenEnterRate = completed.length
    ? Math.round((completed.filter((session) => (session.fullscreenEnters || 0) > 0).length / completed.length) * 100)
    : 0;
  const ambientUsageRate = completed.length
    ? Math.round((completed.filter((session) => session.ambientUsed).length / completed.length) * 100)
    : 0;
  const themeCounts = completed.reduce((accumulator, session) => {
    const key = session.themeId || "unknown";
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});
  const deviceCounts = completed.reduce((accumulator, session) => {
    const key = session.deviceType || "desktop";
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});
  const returnVisits = completed.filter((session) => session.isReturnVisit).length;
  const returnVisitRate = completed.length ? Math.round((returnVisits / completed.length) * 100) : 0;
  const longestSessions = [...completed]
    .sort((left, right) => (right.durationSec || 0) - (left.durationSec || 0))
    .slice(0, 5)
    .map((session) => ({
      id: session.id,
      themeId: session.themeId,
      durationSec: session.durationSec,
      startedAt: session.startedAt
    }));
  const recentEvents = sessions
    .flatMap((session) => (session.events || []).map((event) => ({ ...event, sessionId: session.id })))
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 20);

  const now = Date.now();
  const hourMs = 60 * 60 * 1000;
  const sessionTimeline = Array.from({ length: 12 }, (_, offset) => {
    const bucketStart = now - (11 - offset) * hourMs;
    const bucketEnd = bucketStart + hourMs;
    const count = sessions.filter((session) => {
      const started = new Date(session.startedAt).getTime();
      return started >= bucketStart && started < bucketEnd;
    }).length;
    return { label: new Date(bucketStart).toISOString().slice(11, 16), count };
  });

  return {
    mode: "local",
    activeSessions,
    avgSessionDurationSec,
    fullscreenEnterRate,
    ambientUsageRate,
    returnVisitRate,
    totalSessions: completed.length,
    themeCounts,
    deviceCounts,
    longestSessions,
    sessionTimeline,
    recentEvents
  };
}

async function startSupabaseSession({ themeId, routePath }) {
  const visitorId = getVisitorId();
  const id = crypto.randomUUID();
  const startedAt = new Date().toISOString();
  const row = {
    id,
    visitor_id: visitorId,
    started_at: startedAt,
    ended_at: null,
    duration_seconds: null,
    device_type: detectDeviceType(),
    browser: detectBrowser(),
    os: detectOs(),
    referrer: document.referrer || null,
    landing_path: routePath || "/"
  };
  const { error } = await supabase.from("analytics_sessions").insert(row);
  if (error) {
    throw error;
  }
  return { id, visitorId, startedAt, themeId: themeId || "unknown", routePath: routePath || "/" };
}

async function trackSupabaseEvent({ sessionId, visitorId, eventName, themeName, path, metadata }) {
  const row = {
    id: crypto.randomUUID(),
    session_id: sessionId,
    visitor_id: visitorId,
    event_name: eventName,
    theme_name: themeName || null,
    path: path || null,
    metadata: metadata || {},
    created_at: new Date().toISOString()
  };
  const { error } = await supabase.from("analytics_events").insert(row);
  if (error) {
    throw error;
  }
}

function rememberError(error) {
  runtimeState.lastError = error?.message || "unknown";
}

export function getAnalyticsModeInfo() {
  return {
    mode: runtimeState.mode,
    lastError: runtimeState.lastError
  };
}

export async function startAnalyticsSession({ themeId, routePath }) {
  const fallback = createLocalSession({ themeId, routePath });
  runtimeState.activeSession = fallback;

  if (!isSupabaseConfigured || !supabase) {
    runtimeState.mode = "local";
    return fallback;
  }

  try {
    const remote = await startSupabaseSession({ themeId, routePath });
    runtimeState.mode = "supabase";
    runtimeState.activeSession = remote;
    await trackSupabaseEvent({
      sessionId: remote.id,
      visitorId: remote.visitorId,
      eventName: "session_start",
      themeName: themeId,
      path: routePath,
      metadata: { source: "web" }
    });
    return remote;
  } catch (error) {
    rememberError(error);
    runtimeState.mode = "local";
    return fallback;
  }
}

export function trackAnalyticsEvent(session, eventName, payload = {}) {
  if (!session?.id || !eventName) {
    return;
  }

  mutateLocalSession(session.id, (current) => {
    const events = current.events || [];
    return {
      ...current,
      events: [
        ...events,
        {
          eventName,
          themeName: payload.themeName || current.themeId || "unknown",
          path: payload.path || current.routePath || "/",
          metadata: payload.metadata || {},
          createdAt: new Date().toISOString()
        }
      ]
    };
  });

  if (eventName === "fullscreen_enter") {
    mutateLocalSession(session.id, (current) => ({ ...current, fullscreenEnters: (current.fullscreenEnters || 0) + 1 }));
  }

  if (eventName === "audio_on") {
    mutateLocalSession(session.id, (current) => ({ ...current, ambientUsed: true }));
  }

  if (!isSupabaseConfigured || !supabase || runtimeState.mode !== "supabase") {
    return;
  }

  trackSupabaseEvent({
    sessionId: session.id,
    visitorId: session.visitorId,
    eventName,
    themeName: payload.themeName || null,
    path: payload.path || null,
    metadata: payload.metadata || {}
  }).catch((error) => {
    rememberError(error);
    runtimeState.mode = "local";
  });
}

export function markFullscreenEnter(session) {
  trackAnalyticsEvent(session, "fullscreen_enter");
}

export function markFullscreenExit(session) {
  trackAnalyticsEvent(session, "fullscreen_exit");
}

export function markAmbientUsed(session) {
  trackAnalyticsEvent(session, "audio_on");
}

export function markAmbientOff(session) {
  trackAnalyticsEvent(session, "audio_off");
}

export function markViewerEnter(session, themeName, path) {
  trackAnalyticsEvent(session, "viewer_enter", { themeName, path });
}

export function markThemeView(session, themeName, path) {
  trackAnalyticsEvent(session, "theme_view", { themeName, path });
}

export function markThemeSwitch(session, themeName, path) {
  trackAnalyticsEvent(session, "theme_switch", { themeName, path });
}

export function markSettingsOpen(session, themeName, path) {
  trackAnalyticsEvent(session, "settings_open", { themeName, path });
}

export async function endAnalyticsSession(session) {
  if (!session?.id) {
    return;
  }

  const localEnded = mutateLocalSession(session.id, (current) => {
    if (current.endedAt) return current;
    const endedAt = new Date().toISOString();
    const durationSec = Math.max(0, Math.round((new Date(endedAt).getTime() - new Date(current.startedAt).getTime()) / 1000));
    return {
      ...current,
      endedAt,
      durationSec
    };
  });

  if (!isSupabaseConfigured || !supabase || runtimeState.mode !== "supabase") {
    return;
  }

  try {
    const endedAt = new Date().toISOString();
    const startedAt = new Date(session.startedAt || endedAt).getTime();
    const durationSeconds = Math.max(0, Math.round((new Date(endedAt).getTime() - startedAt) / 1000));
    const { error } = await supabase
      .from("analytics_sessions")
      .update({
        ended_at: endedAt,
        duration_seconds: durationSeconds
      })
      .eq("id", session.id)
      .is("ended_at", null);

    if (error) {
      throw error;
    }

    await trackSupabaseEvent({
      sessionId: session.id,
      visitorId: session.visitorId,
      eventName: "session_end",
      themeName: session.themeId,
      path: session.routePath,
      metadata: { durationSeconds }
    });
  } catch (error) {
    rememberError(error);
    runtimeState.mode = "local";
    if (!localEnded) {
      summarizeLocal();
    }
  }
}

export function clearAnalyticsSessions() {
  window.localStorage.removeItem(STORE_KEY);
}

export async function getAnalyticsSummary() {
  const local = summarizeLocal();

  if (!isSupabaseConfigured || !supabase) {
    return {
      ...local,
      mode: "local",
      fallbackReason: "supabase_not_configured"
    };
  }

  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { data: sessions, error: sessionsError } = await supabase.from("analytics_sessions").select("*").order("started_at", { ascending: false }).limit(2000);
    if (sessionsError) {
      throw sessionsError;
    }

    const { data: events, error: eventsError } = await supabase.from("analytics_events").select("*").order("created_at", { ascending: false }).limit(1000);
    if (eventsError) {
      throw eventsError;
    }

    const completed = sessions.filter((session) => typeof session.duration_seconds === "number");
    const activeSessions = sessions.filter((session) => !session.ended_at).length;
    const avgSessionDurationSec = Math.round(average(completed.map((session) => session.duration_seconds || 0)));
    const uniqueVisitors = new Set(sessions.map((session) => session.visitor_id).filter(Boolean)).size;
    const sessionsToday = sessions.filter((session) => new Date(session.started_at).getTime() >= todayStart.getTime()).length;

    const fullscreenSessionIds = new Set(events.filter((event) => event.event_name === "fullscreen_enter").map((event) => event.session_id));
    const audioSessionIds = new Set(events.filter((event) => event.event_name === "audio_on").map((event) => event.session_id));
    const fullscreenEnterRate = completed.length ? Math.round((fullscreenSessionIds.size / completed.length) * 100) : 0;
    const ambientUsageRate = completed.length ? Math.round((audioSessionIds.size / completed.length) * 100) : 0;

    const themeCounts = sessions.reduce((accumulator, session) => {
      const key =
        events.find((event) => event.session_id === session.id && event.event_name === "theme_view")?.theme_name ||
        (session.landing_path?.includes("aurora") ? "aurora-night" : "night-sky");
      accumulator[key] = (accumulator[key] || 0) + 1;
      return accumulator;
    }, {});

    const themeDurations = completed.reduce((accumulator, session) => {
      const key =
        events.find((event) => event.session_id === session.id && event.event_name === "theme_view")?.theme_name ||
        (session.landing_path?.includes("aurora") ? "aurora-night" : "night-sky");
      const record = accumulator[key] || { total: 0, count: 0 };
      record.total += session.duration_seconds || 0;
      record.count += 1;
      accumulator[key] = record;
      return accumulator;
    }, {});

    const averageByTheme = Object.fromEntries(
      Object.entries(themeDurations).map(([key, value]) => [key, Math.round(value.count ? value.total / value.count : 0)])
    );

    const deviceCounts = sessions.reduce((accumulator, session) => {
      const key = session.device_type || "desktop";
      accumulator[key] = (accumulator[key] || 0) + 1;
      return accumulator;
    }, {});

    const visitorSessionCount = sessions.reduce((accumulator, session) => {
      const key = session.visitor_id || "unknown";
      accumulator[key] = (accumulator[key] || 0) + 1;
      return accumulator;
    }, {});
    const returnVisitors = Object.values(visitorSessionCount).filter((count) => count > 1).length;
    const returnVisitRate = uniqueVisitors ? Math.round((returnVisitors / uniqueVisitors) * 100) : 0;

    const longestSessions = [...completed]
      .sort((left, right) => (right.duration_seconds || 0) - (left.duration_seconds || 0))
      .slice(0, 5)
      .map((session) => ({
        id: session.id,
        themeId:
          events.find((event) => event.session_id === session.id && event.event_name === "theme_view")?.theme_name ||
          (session.landing_path?.includes("aurora") ? "aurora-night" : "night-sky"),
        durationSec: session.duration_seconds || 0,
        startedAt: session.started_at
      }));

    const now = Date.now();
    const hourMs = 60 * 60 * 1000;
    const sessionTimeline = Array.from({ length: 12 }, (_, offset) => {
      const bucketStart = now - (11 - offset) * hourMs;
      const bucketEnd = bucketStart + hourMs;
      const count = sessions.filter((session) => {
        const started = new Date(session.started_at).getTime();
        return started >= bucketStart && started < bucketEnd;
      }).length;
      return { label: new Date(bucketStart).toISOString().slice(11, 16), count };
    });

    return {
      mode: "supabase",
      fallbackReason: "",
      activeSessions,
      totalVisitors: uniqueVisitors,
      sessionsToday,
      avgSessionDurationSec,
      fullscreenEnterRate,
      ambientUsageRate,
      returnVisitRate,
      totalSessions: completed.length,
      themeCounts,
      averageByTheme,
      deviceCounts,
      longestSessions,
      sessionTimeline,
      recentEvents: events.slice(0, 25).map((event) => ({
        id: event.id,
        eventName: event.event_name,
        themeName: event.theme_name,
        path: event.path,
        createdAt: event.created_at
      }))
    };
  } catch (error) {
    rememberError(error);
    runtimeState.mode = "local";
    return {
      ...local,
      mode: "local",
      fallbackReason: error?.message || "query_failed"
    };
  }
}
