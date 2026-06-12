import { useEffect } from "react";
import { MonsoonRainCanvas } from "./MonsoonRainCanvas.jsx";
import { useRainThunder } from "../../hooks/useRainThunder.js";
import { HeaderActionGroup } from "../HeaderActionGroup.jsx";

export function MonsoonCanopyExperience({
  viewerRef,
  isFullscreen,
  language,
  updateLanguage,
  headerEyebrow,
  headerTitle,
  headerSubtitle,
  ambientEnabled,
  toggleAmbientSound,
  ambientVolume,
  setAmbientVolume,
  toggleFullscreen,
  closeRainViewer,
  rainIntensity,
  setRainIntensity,
  rainFlow,
  setRainFlow,
  rainPreset,
  applyRainPreset,
  rainThunderEnabled,
  setRainThunderEnabled,
  showRainMoodControls,
  setShowRainMoodControls,
  ensureAmbientOn
}) {
  const { flashToken } = useRainThunder({
    enabled: rainThunderEnabled,
    audioEnabled: ambientEnabled,
    intensity: rainIntensity
  });

  useEffect(() => {
    ensureAmbientOn?.();
  }, [ensureAmbientOn]);

  useEffect(() => {
    if (isFullscreen) {
      setShowRainMoodControls(false);
    }
  }, [isFullscreen, setShowRainMoodControls]);

  return (
    <div ref={viewerRef} className={`rain-page ${isFullscreen ? "is-fullscreen-view" : ""}`}>
      <header className={`aurora-floating-header rain-floating-header ${isFullscreen ? "is-hidden" : ""}`}>
        <div className="aurora-header-controls">
          <HeaderActionGroup language={language} onLanguageChange={updateLanguage} showHome />
        </div>
      </header>

      <section className={`rain-hero-copy ${isFullscreen ? "is-hidden" : ""}`}>
        <p className="eyebrow">{headerEyebrow}</p>
        <h1 className="aurora-title">{headerTitle}</h1>
        <p className="aurora-subtitle">{headerSubtitle}</p>
      </section>

      <section className="rain-scene" style={{ "--rain-intensity": rainIntensity, "--rain-flow": rainFlow }}>
        <div className="rain-photo-backdrop" />
        <div className="rain-photo-shade" />
        <MonsoonRainCanvas intensity={rainIntensity} flow={rainFlow} />
        {rainThunderEnabled ? <div key={flashToken} className="rain-thunder-flash is-enabled" /> : null}
        <div className="rain-canopy-mist rain-canopy-mist-back" />
        <div className="rain-window-haze" />
        <div className="rain-canopy-mist rain-canopy-mist-front" />
      </section>

      <section className={`rain-mood-dock immersive-mood-dock ${showRainMoodControls ? "is-open" : ""} ${isFullscreen ? "is-hidden" : ""}`}>
        <button type="button" className={`overlay-button ${showRainMoodControls ? "is-active" : ""}`} onClick={() => setShowRainMoodControls((current) => !current)}>
          {language === "ko" ? "무드" : "Mood"}
        </button>
        {showRainMoodControls ? (
          <div className="rain-mood-panel immersive-mood-popover">
            <label>
              <span>{language === "ko" ? `빗줄기 강도 ${Math.round(rainIntensity * 100)}%` : `Rain intensity ${Math.round(rainIntensity * 100)}%`}</span>
              <input type="range" min="0.25" max="0.95" step="0.01" value={rainIntensity} onChange={(event) => setRainIntensity(Number(event.target.value))} />
            </label>
            <label>
              <span>{language === "ko" ? `흐름 속도 ${Math.round(rainFlow * 100)}%` : `Flow speed ${Math.round(rainFlow * 100)}%`}</span>
              <input type="range" min="0.25" max="0.9" step="0.01" value={rainFlow} onChange={(event) => setRainFlow(Number(event.target.value))} />
            </label>
            <button
              type="button"
              className={`focus-chip rain-thunder-toggle ${rainThunderEnabled ? "is-active" : ""}`}
              onClick={() => setRainThunderEnabled((current) => !current)}
            >
              {rainThunderEnabled
                ? language === "ko"
                  ? "먼 천둥 켜짐"
                  : "Distant thunder on"
                : language === "ko"
                  ? "먼 천둥 꺼짐"
                  : "Distant thunder off"}
            </button>
            <div className="time-jump-row rain-mood-presets">
              <button type="button" className={`focus-chip ${rainPreset === "light" ? "is-active" : ""}`} onClick={() => applyRainPreset("light")}>
                {language === "ko" ? "가벼운 비" : "Light rain"}
              </button>
              <button type="button" className={`focus-chip ${rainPreset === "balanced" ? "is-active" : ""}`} onClick={() => applyRainPreset("balanced")}>
                {language === "ko" ? "기본 감상" : "Balanced"}
              </button>
              <button type="button" className={`focus-chip ${rainPreset === "deep" ? "is-active" : ""}`} onClick={() => applyRainPreset("deep")}>
                {language === "ko" ? "짙은 빗소리" : "Deep rain"}
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <section className={`viewer-overlay rain-bottom-controls immersive-bottom-controls ${isFullscreen ? "is-hidden" : ""}`}>
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
          <button type="button" className="overlay-button" onClick={closeRainViewer}>
            {language === "ko" ? "감상 종료" : "End Session"}
          </button>
        </div>
      </section>
    </div>
  );
}
