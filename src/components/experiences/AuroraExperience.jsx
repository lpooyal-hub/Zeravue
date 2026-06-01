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
  ambientVolume,
  setAmbientVolume,
  toggleFullscreen
}) {
  return (
    <div className={`aurora-page ${isFullscreen ? "is-fullscreen-view" : ""}`}>
      {shouldShowAuroraPageChrome ? (
        <>
          <header className="aurora-floating-header aurora-landing-header">
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

          <section className="aurora-landing-content">
            <p className="eyebrow">{headerEyebrow || dictionary.viewer.eyebrow}</p>
            {auroraRenderer === "webgl" ? <p className="aurora-experimental-badge">Experimental WebGL</p> : null}
            <h1 className="aurora-title">{headerTitle || dictionary.viewer.title}</h1>
            <p className="aurora-subtitle">{headerSubtitle || dictionary.viewer.subtitle}</p>
            <button type="button" className="primary-button aurora-start-button" onClick={startAuroraViewer}>
              {language === "ko" ? "감상 시작" : "Enter Aurora"}
            </button>
            <p className="aurora-start-hint">
              {language === "ko"
                ? "감상 중 화면을 터치하거나 움직이면 무드/소리 조작이 다시 나타납니다."
                : "During viewing, move or tap the screen to reveal mood and sound controls again."}
            </p>
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
        <section className={`aurora-mood-dock ${showAuroraMoodControls ? "is-open" : ""}`}>
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
            <div className="aurora-soft-controls-body aurora-mood-popover">
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
                  {language === "ko" ? "잔잔한 흐름" : "Quiet flow"}
                </button>
                <button type="button" className="focus-chip" onClick={() => { setAuroraIntensity(0.58); setAuroraSpeed(0.44); }}>
                  {language === "ko" ? "기본 감상" : "Balanced"}
                </button>
                <button type="button" className="focus-chip" onClick={() => { setAuroraIntensity(0.74); setAuroraSpeed(0.56); }}>
                  {language === "ko" ? "선명한 연출" : "Vivid motion"}
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <section className={`viewer-overlay aurora-live-controls ${showAuroraMoodControls ? "is-open" : ""}`}>
          <label className="overlay-volume">
            <span>{language === "ko" ? "볼륨" : "Volume"}</span>
            <input type="range" min="0.5" max="1.15" step="0.05" value={ambientVolume} onChange={(event) => setAmbientVolume(Number(event.target.value))} />
            <strong>{Math.round(ambientVolume * 100)}%</strong>
          </label>
          <div className="aurora-live-quick-actions">
            <button type="button" className="overlay-button" onClick={toggleFullscreen}>
              {isFullscreen ? (language === "ko" ? "전체화면 종료" : "Exit fullscreen") : language === "ko" ? "전체화면" : "Fullscreen"}
            </button>
            <button type="button" className={`overlay-button ${ambientEnabled ? "is-active" : ""}`} onClick={toggleAmbientSound}>
              {language === "ko" ? "사운드" : "Sound"}
            </button>
            <button type="button" className="overlay-button" onClick={closeAuroraViewer}>
              {language === "ko" ? "종료" : "Exit"}
            </button>
          </div>
        </section>
      </section>
    </div>
  );
}
