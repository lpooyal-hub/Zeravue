import { AuroraPanoramaScene } from "../AuroraPanoramaScene.jsx";
import { AuroraLiveViewer } from "../AuroraLiveViewer.jsx";

export function AuroraExperience({
  isFullscreen,
  shouldShowAuroraPageChrome,
  language,
  updateLanguage,
  headerEyebrow,
  headerTitle,
  headerSubtitle,
  dictionary,
  auroraRenderer,
  startAuroraViewer,
  wakeAmbient,
  revealAuroraUi,
  auroraViewerRef,
  auroraViewerOpen,
  auroraUiVisible,
  immersiveIntro,
  showAuroraMoodControls,
  setShowAuroraMoodControls,
  markSettingsOpen,
  analyticsSessionRef,
  currentThemeId,
  ambientEnabled,
  toggleAmbientSound,
  closeAuroraViewer,
  auroraIntensity,
  setAuroraIntensity,
  auroraSpeed,
  setAuroraSpeed,
  auroraWindProfile,
  setAuroraWindProfile,
  ambientVolume,
  setAmbientVolume,
  toggleFullscreen
}) {
  return (
    <div className={`aurora-page ${isFullscreen ? "is-fullscreen-view" : ""}`}>
      {shouldShowAuroraPageChrome ? (
        <>
          <header className={`aurora-floating-header aurora-landing-header ${isFullscreen ? "is-hidden" : ""}`}>
            <a className="aurora-header-logo-wrap" href="/" aria-label={language === "ko" ? "메인 홈으로 이동" : "Go to home"}>
              <img className="aurora-header-logo" src="/branding/zeravue-logo.svg" alt="Zeravue logo" />
            </a>
            <div className="aurora-header-controls">
              <div className="language-switcher" aria-label="Language">
                <button type="button" aria-pressed={language === "en"} onClick={() => updateLanguage("en")}>
                  EN
                </button>
                <button type="button" aria-pressed={language === "ko"} onClick={() => updateLanguage("ko")}>
                  KR
                </button>
              </div>
            </div>
          </header>

          <section className={`aurora-landing-content ${isFullscreen ? "is-hidden" : ""}`}>
            <p className="eyebrow">{headerEyebrow || dictionary.viewer.eyebrow}</p>
            {auroraRenderer === "webgl" ? <p className="aurora-experimental-badge">Experimental WebGL</p> : null}
            <h1 className="aurora-title">{headerTitle || dictionary.viewer.title}</h1>
            {headerSubtitle || dictionary.viewer.subtitle ? <p className="aurora-subtitle">{headerSubtitle || dictionary.viewer.subtitle}</p> : null}
          </section>
        </>
      ) : null}

      <section
        ref={auroraViewerRef}
        className={`aurora-live-shell ${auroraViewerOpen ? "is-open" : ""} ${auroraUiVisible ? "ui-visible" : ""}`}
        onClickCapture={wakeAmbient}
        onWheelCapture={wakeAmbient}
        onPointerDownCapture={(event) => {
          wakeAmbient(event);
          revealAuroraUi();
        }}
        onTouchStartCapture={(event) => {
          wakeAmbient(event);
          revealAuroraUi();
        }}
        onPointerMoveCapture={revealAuroraUi}
      >
        {auroraRenderer === "webgl" ? <AuroraLiveViewer intensity={auroraIntensity} speed={auroraSpeed} /> : <AuroraPanoramaScene />}
        {immersiveIntro ? (
          <div className="ambient-intro-overlay">
            <h2>{immersiveIntro.title}</h2>
            <p>{immersiveIntro.subtitle}</p>
          </div>
        ) : null}
        <section className={`aurora-mood-dock immersive-mood-dock ${showAuroraMoodControls ? "is-open" : ""}`}>
          <button
            type="button"
            className={`overlay-button ${showAuroraMoodControls ? "is-active" : ""}`}
            onClick={() =>
              setShowAuroraMoodControls((current) => {
                const next = !current;
                if (next) {
                  markSettingsOpen(analyticsSessionRef.current, currentThemeId, window.location.pathname || "/");
                }
                return next;
              })
            }
          >
            {language === "ko" ? "무드" : "Mood"}
          </button>
          {showAuroraMoodControls ? (
            <div className="aurora-soft-controls-body aurora-mood-popover immersive-mood-popover">
              <label>
                <span>{language === "ko" ? `오로라 강도 ${Math.round(auroraIntensity * 100)}%` : `Intensity ${Math.round(auroraIntensity * 100)}%`}</span>
                <input type="range" min="0.25" max="0.9" step="0.01" value={auroraIntensity} onChange={(event) => setAuroraIntensity(Number(event.target.value))} />
              </label>
              <label>
                <span>{language === "ko" ? `오로라 흐름 ${Math.round(auroraSpeed * 100)}%` : `Flow ${Math.round(auroraSpeed * 100)}%`}</span>
                <input type="range" min="0.18" max="0.78" step="0.01" value={auroraSpeed} onChange={(event) => setAuroraSpeed(Number(event.target.value))} />
              </label>
              <div className="time-jump-row">
                <button type="button" className="focus-chip" onClick={() => { setAuroraIntensity(0.42); setAuroraSpeed(0.32); }}>
                  {language === "ko" ? "잔잔한 오로라" : "Quiet glow"}
                </button>
                <button type="button" className="focus-chip" onClick={() => { setAuroraIntensity(0.58); setAuroraSpeed(0.44); }}>
                  {language === "ko" ? "기본 감상" : "Balanced"}
                </button>
                <button type="button" className="focus-chip" onClick={() => { setAuroraIntensity(0.74); setAuroraSpeed(0.56); }}>
                  {language === "ko" ? "선명한 흐름" : "Vivid flow"}
                </button>
              </div>
              <div className="time-jump-row aurora-sound-presets">
                <button type="button" className={`focus-chip ${auroraWindProfile === "rough" ? "is-active" : ""}`} onClick={() => setAuroraWindProfile("rough")}>
                  {language === "ko" ? "거친 바람" : "Rough wind"}
                </button>
                <button type="button" className={`focus-chip ${auroraWindProfile === "distant" ? "is-active" : ""}`} onClick={() => setAuroraWindProfile("distant")}>
                  {language === "ko" ? "먼 바람" : "Distant wind"}
                </button>
                <button type="button" className={`focus-chip ${auroraWindProfile === "cold" ? "is-active" : ""}`} onClick={() => setAuroraWindProfile("cold")}>
                  {language === "ko" ? "차가운 바람" : "Cold wind"}
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <section className={`viewer-overlay aurora-live-controls immersive-bottom-controls ${showAuroraMoodControls ? "is-open" : ""}`}>
          <label className="overlay-volume">
            <span>{language === "ko" ? "볼륨" : "Volume"}</span>
            <input type="range" min="0.5" max="1.15" step="0.05" value={ambientVolume} onChange={(event) => setAmbientVolume(Number(event.target.value))} />
            <strong>{Math.round(ambientVolume * 100)}%</strong>
          </label>
          <div className="aurora-live-quick-actions immersive-quick-actions">
            <button type="button" className={`overlay-button ${ambientEnabled ? "is-active" : ""}`} onClick={toggleAmbientSound}>
              {ambientEnabled ? (language === "ko" ? "사운드 끄기" : "Sound Off") : language === "ko" ? "사운드 켜기" : "Sound On"}
            </button>
            <button type="button" className="overlay-button" onClick={toggleFullscreen}>
              {isFullscreen ? (language === "ko" ? "전체화면 종료" : "Exit fullscreen") : language === "ko" ? "전체화면" : "Fullscreen"}
            </button>
            <button type="button" className="overlay-button" onClick={closeAuroraViewer}>
              {language === "ko" ? "감상 종료" : "End Session"}
            </button>
          </div>
        </section>
      </section>
    </div>
  );
}
