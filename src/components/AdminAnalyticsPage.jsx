import { useEffect, useMemo, useState } from "react";
import { clearAnalyticsSessions, getAnalyticsModeInfo, getAnalyticsSummary } from "../lib/analyticsStore.js";

function formatDuration(seconds) {
  const safe = Math.max(0, Number(seconds) || 0);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function themeLabel(themeId, language) {
  if (themeId === "night-sky") {
    return language === "ko" ? "밤하늘" : "Night Sky";
  }
  if (themeId === "aurora-night") {
    return language === "ko" ? "오로라" : "Aurora";
  }
  return themeId || (language === "ko" ? "기타" : "Other");
}

export function AdminAnalyticsPage({ language = "en", onBackHome }) {
  const [refreshTick, setRefreshTick] = useState(0);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminKeyInput, setAdminKeyInput] = useState("");
  const [adminKey, setAdminKey] = useState(() => window.sessionStorage.getItem("zeravue-admin-key") || "");
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (!adminKey) {
      setLoading(false);
      setSummary(null);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    getAnalyticsSummary(adminKey)
      .then((result) => {
        if (!cancelled) {
          setSummary(result);
          setAuthError("");
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setAuthError(error?.message || "Failed to load analytics");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [adminKey, refreshTick]);

  const modeInfo = useMemo(() => getAnalyticsModeInfo(), [refreshTick, summary]);
  if (!adminKey) {
    return (
      <div className="ambient-admin-page">
        <header className="ambient-admin-header">
          <div>
            <p className="eyebrow">Zeravue · Admin Access</p>
            <h1>{language === "ko" ? "관리자 키를 입력하세요" : "Enter Admin Key"}</h1>
            <p>{language === "ko" ? "/admin 페이지는 보호된 접근만 허용됩니다." : "The admin dashboard requires protected access."}</p>
          </div>
          <div className="ambient-admin-actions">
            <button type="button" className="overlay-button is-active" onClick={onBackHome}>
              {language === "ko" ? "홈으로" : "Back Home"}
            </button>
          </div>
        </header>
        <section className="ambient-admin-panel">
          <h2>{language === "ko" ? "접근 인증" : "Access Authentication"}</h2>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            <input
              type="password"
              value={adminKeyInput}
              onChange={(event) => setAdminKeyInput(event.target.value)}
              placeholder={language === "ko" ? "ADMIN_DASHBOARD_KEY 입력" : "Enter ADMIN_DASHBOARD_KEY"}
              style={{
                minWidth: "280px",
                padding: "10px 12px",
                borderRadius: "10px",
                border: "1px solid rgba(158, 181, 216, 0.28)",
                background: "rgba(7, 15, 30, 0.72)",
                color: "var(--text-primary)"
              }}
            />
            <button
              type="button"
              className="overlay-button"
              onClick={() => {
                const nextKey = adminKeyInput.trim();
                if (!nextKey) return;
                window.sessionStorage.setItem("zeravue-admin-key", nextKey);
                setAdminKey(nextKey);
                setRefreshTick((value) => value + 1);
              }}
            >
              {language === "ko" ? "접속" : "Unlock"}
            </button>
          </div>
          {authError ? <p style={{ marginTop: "12px", color: "#ffafaf" }}>{authError}</p> : null}
        </section>
      </div>
    );
  }

  if (loading || !summary) {
    return <div className="ambient-admin-page">{language === "ko" ? "분석 데이터를 불러오는 중..." : "Loading analytics..."}</div>;
  }

  const themeEntries = Object.entries(summary.themeCounts).sort((a, b) => b[1] - a[1]);
  const deviceEntries = Object.entries(summary.deviceCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="ambient-admin-page">
      <header className="ambient-admin-header">
        <div>
          <p className="eyebrow">Zeravue · Quiet Activity</p>
          <h1>{language === "ko" ? "차분한 이용 흐름" : "Quiet Usage Flow"}</h1>
          <p>{language === "ko" ? "숫자를 추적하기보다, 사람들이 얼마나 오래 머무는지 관찰합니다." : "Observe how long people stay, not just how many clicks happen."}</p>
          {summary.mode === "local" ? (
            <small className="ambient-admin-mode">
              {language === "ko" ? "Local fallback mode" : "Local fallback mode"}
              {summary.fallbackReason ? ` · ${summary.fallbackReason}` : ""}
              {modeInfo.lastError ? ` · ${modeInfo.lastError}` : ""}
            </small>
          ) : null}
        </div>
        <div className="ambient-admin-actions">
          <button type="button" className="overlay-button" onClick={() => setRefreshTick((value) => value + 1)}>
            {language === "ko" ? "새로고침" : "Refresh"}
          </button>
          <button
            type="button"
            className="overlay-button"
            onClick={() => {
              clearAnalyticsSessions();
              setRefreshTick((value) => value + 1);
            }}
          >
            {language === "ko" ? "데이터 비우기" : "Clear Data"}
          </button>
          <button type="button" className="overlay-button is-active" onClick={onBackHome}>
            {language === "ko" ? "홈으로" : "Back Home"}
          </button>
          <button
            type="button"
            className="overlay-button"
            onClick={() => {
              window.sessionStorage.removeItem("zeravue-admin-key");
              setAdminKey("");
              setAdminKeyInput("");
            }}
          >
            {language === "ko" ? "잠금" : "Lock"}
          </button>
        </div>
      </header>

      <section className="ambient-admin-grid">
        <article className="ambient-admin-card">
          <span>{language === "ko" ? "총 방문자" : "Total Visitors"}</span>
          <strong>{summary.totalVisitors ?? summary.totalSessions}</strong>
        </article>
        <article className="ambient-admin-card">
          <span>{language === "ko" ? "오늘 세션" : "Sessions Today"}</span>
          <strong>{summary.sessionsToday ?? summary.activeSessions}</strong>
        </article>
        <article className="ambient-admin-card">
          <span>{language === "ko" ? "활성 세션" : "Active Sessions"}</span>
          <strong>{summary.activeSessions}</strong>
        </article>
        <article className="ambient-admin-card">
          <span>{language === "ko" ? "평균 체류 시간" : "Avg Session Duration"}</span>
          <strong>{formatDuration(summary.avgSessionDurationSec)}</strong>
        </article>
        <article className="ambient-admin-card">
          <span>{language === "ko" ? "전체화면 진입률" : "Fullscreen Enter Rate"}</span>
          <strong>{summary.fullscreenEnterRate}%</strong>
        </article>
        <article className="ambient-admin-card">
          <span>{language === "ko" ? "앰비언트 사용률" : "Ambient Audio Usage"}</span>
          <strong>{summary.ambientUsageRate}%</strong>
        </article>
        <article className="ambient-admin-card">
          <span>{language === "ko" ? "재방문 비율" : "Return Visits"}</span>
          <strong>{summary.returnVisitRate}%</strong>
        </article>
        <article className="ambient-admin-card">
          <span>{language === "ko" ? "완료 세션 수" : "Completed Sessions"}</span>
          <strong>{summary.totalSessions}</strong>
        </article>
      </section>

      <section className="ambient-admin-panels">
        <article className="ambient-admin-panel">
          <h2>{language === "ko" ? "테마 인기도" : "Theme Popularity"}</h2>
          <ul>
            {themeEntries.length ? (
              themeEntries.map(([themeId, count]) => (
                <li key={themeId}>
                  <span>{themeLabel(themeId, language)}</span>
                  <strong>{count}</strong>
                </li>
              ))
            ) : (
              <li>
                <span>{language === "ko" ? "기록 없음" : "No activity yet"}</span>
              </li>
            )}
          </ul>
        </article>

        <article className="ambient-admin-panel">
          <h2>{language === "ko" ? "테마별 평균 체류" : "Avg Stay by Theme"}</h2>
          <ul>
            {Object.entries(summary.averageByTheme || {}).length ? (
              Object.entries(summary.averageByTheme).map(([themeId, duration]) => (
                <li key={themeId}>
                  <span>{themeLabel(themeId, language)}</span>
                  <strong>{formatDuration(duration)}</strong>
                </li>
              ))
            ) : (
              <li>
                <span>{language === "ko" ? "기록 없음" : "No activity yet"}</span>
              </li>
            )}
          </ul>
        </article>

        <article className="ambient-admin-panel">
          <h2>{language === "ko" ? "기기 비율" : "Device Breakdown"}</h2>
          <ul>
            {deviceEntries.length ? (
              deviceEntries.map(([device, count]) => (
                <li key={device}>
                  <span>{device}</span>
                  <strong>{count}</strong>
                </li>
              ))
            ) : (
              <li>
                <span>{language === "ko" ? "기록 없음" : "No activity yet"}</span>
              </li>
            )}
          </ul>
        </article>

        <article className="ambient-admin-panel">
          <h2>{language === "ko" ? "가장 오래 머문 세션" : "Longest Sessions"}</h2>
          <ul>
            {summary.longestSessions.length ? (
              summary.longestSessions.map((session) => (
                <li key={session.id}>
                  <span>{themeLabel(session.themeId, language)}</span>
                  <strong>{formatDuration(session.durationSec)}</strong>
                </li>
              ))
            ) : (
              <li>
                <span>{language === "ko" ? "기록 없음" : "No activity yet"}</span>
              </li>
            )}
          </ul>
        </article>
      </section>

      <section className="ambient-admin-timeline">
        <h2>{language === "ko" ? "세션 타임라인 (최근 12시간)" : "Session Timeline (Last 12h)"}</h2>
        <div className="ambient-admin-bars">
          {summary.sessionTimeline.map((bucket) => (
            <div key={bucket.label} className="ambient-admin-bar-item">
              <span>{bucket.label}</span>
              <div className="ambient-admin-bar-track">
                <div className="ambient-admin-bar-fill" style={{ width: `${Math.min(100, bucket.count * 16)}%` }} />
              </div>
              <strong>{bucket.count}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="ambient-admin-panel">
        <h2>{language === "ko" ? "최근 이벤트" : "Recent Events"}</h2>
        <ul>
          {(summary.recentEvents || []).length ? (
            summary.recentEvents.slice(0, 12).map((event) => (
              <li key={event.id || `${event.eventName}-${event.createdAt}`}>
                <span>
                  {event.eventName}
                  {event.themeName ? ` · ${themeLabel(event.themeName, language)}` : ""}
                </span>
                <strong>{new Date(event.createdAt).toLocaleTimeString(language === "ko" ? "ko-KR" : "en-US", { hour: "2-digit", minute: "2-digit" })}</strong>
              </li>
            ))
          ) : (
            <li>
              <span>{language === "ko" ? "기록 없음" : "No events yet"}</span>
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
