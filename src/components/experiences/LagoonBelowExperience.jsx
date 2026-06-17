import { useEffect, useMemo } from "react";
import { HeaderActionGroup } from "../HeaderActionGroup.jsx";

export function LagoonBelowExperience({
  viewerRef,
  isFullscreen,
  language,
  updateLanguage,
  headerEyebrow,
  headerTitle,
  headerSubtitle,
  ambientEnabled,
  toggleAmbientSound,
  breathEnabled,
  toggleBreathSound,
  ambientVolume,
  setAmbientVolume,
  toggleFullscreen,
  closeLagoonViewer,
  lagoonClarity,
  setLagoonClarity,
  lagoonDrift,
  setLagoonDrift,
  depthProgress,
  exhalePulse,
  lagoonPreset,
  applyLagoonPreset,
  showLagoonMoodControls,
  setShowLagoonMoodControls,
  ensureAmbientOn
}) {
  const floatingParticles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => ({
        id: index,
        left: `${6 + ((index * 17) % 86)}%`,
        top: `${8 + ((index * 11) % 72)}%`,
        size: `${8 + (index % 5) * 5}px`,
        delay: `${(index % 6) * -2.4}s`,
        duration: `${16 + (index % 4) * 5}s`
      })),
    []
  );
  const fishSilhouettes = useMemo(
    () =>
      Array.from({ length: 5 }, (_, index) => ({
        id: index,
        top: `${24 + index * 9}%`,
        delay: `${index * -6}s`,
        duration: `${34 + index * 7}s`,
        scale: 0.72 + index * 0.08
      })),
    []
  );

  useEffect(() => {
    ensureAmbientOn?.();
  }, [ensureAmbientOn]);

  useEffect(() => {
    if (isFullscreen) {
      setShowLagoonMoodControls(false);
    }
  }, [isFullscreen, setShowLagoonMoodControls]);

  return (
    <div ref={viewerRef} className={`lagoon-page ${isFullscreen ? "is-fullscreen-view" : ""}`}>
      <header className={`aurora-floating-header lagoon-floating-header ${isFullscreen ? "is-hidden" : ""}`}>
        <div className="scene-floating-header-shell aurora-header-controls">
          <HeaderActionGroup language={language} onLanguageChange={updateLanguage} showHome />
        </div>
      </header>

      <section className={`rain-hero-copy lagoon-hero-copy ${isFullscreen ? "is-hidden" : ""}`}>
        <p className="eyebrow">{headerEyebrow}</p>
        <h1 className="aurora-title">{headerTitle}</h1>
        <p className="aurora-subtitle">{headerSubtitle}</p>
      </section>

      <section
        className={`lagoon-scene lagoon-scene--${lagoonPreset}`}
        data-lagoon-preset={lagoonPreset}
        style={{
          "--lagoon-clarity": lagoonClarity,
          "--lagoon-drift": lagoonDrift,
          "--lagoon-depth-progress": depthProgress
        }}
      >
        <div className="lagoon-depth-gradient" />
        <div className="lagoon-surface-glow" />
        <div className="lagoon-surface-ripple" />
        <div className="lagoon-light-shafts lagoon-light-shafts-a" />
        <div className="lagoon-light-shafts lagoon-light-shafts-b" />
        <div className="lagoon-caustics" />
        <div className="lagoon-haze lagoon-haze-near" />
        <div className="lagoon-haze lagoon-haze-far" />
        <div className="lagoon-depth-vignette" />
        <div className="lagoon-bubble-column lagoon-bubble-column-left" />
        <div className="lagoon-bubble-column lagoon-bubble-column-right" />
        <div className="lagoon-reef lagoon-reef-left" />
        <div className="lagoon-reef lagoon-reef-center" />
        <div className="lagoon-reef lagoon-reef-right" />
        <div className="lagoon-coral-cluster lagoon-coral-left" />
        <div className="lagoon-coral-cluster lagoon-coral-center" />
        <div className="lagoon-coral-cluster lagoon-coral-right" />
        <div className="lagoon-seagrass-bed lagoon-seagrass-left" />
        <div className="lagoon-seagrass-bed lagoon-seagrass-center" />
        <div className="lagoon-seagrass-bed lagoon-seagrass-right" />
        <div className="lagoon-sway lagoon-sway-left" />
        <div className="lagoon-sway lagoon-sway-right" />
        <div className="lagoon-breath-burst-layer" aria-hidden="true">
          {Array.from({ length: 7 }, (_, index) => (
            <span
              key={`${exhalePulse}-${index}`}
              className="lagoon-breath-bubble"
              style={{
                "--lagoon-burst-left": `${44 + ((index % 3) - 1) * 4 + index * 0.6}%`,
                "--lagoon-burst-delay": `${index * 0.12}s`,
                "--lagoon-burst-size": `${10 + (index % 4) * 5}px`
              }}
            />
          ))}
        </div>
        <div className="lagoon-fish-layer" aria-hidden="true">
          {fishSilhouettes.map((fish) => (
            <span
              key={fish.id}
              className="lagoon-fish"
              style={{
                top: fish.top,
                animationDelay: fish.delay,
                animationDuration: fish.duration,
                "--lagoon-fish-scale": fish.scale
              }}
            />
          ))}
        </div>
        <div className="lagoon-particles-layer" aria-hidden="true">
          {floatingParticles.map((particle) => (
            <span
              key={particle.id}
              className="lagoon-particle"
              style={{
                left: particle.left,
                top: particle.top,
                width: particle.size,
                height: particle.size,
                animationDelay: particle.delay,
                animationDuration: particle.duration
              }}
            />
          ))}
        </div>
      </section>

      <section className={`lagoon-mood-dock immersive-mood-dock ${showLagoonMoodControls ? "is-open" : ""} ${isFullscreen ? "is-hidden" : ""}`}>
        <button type="button" className={`overlay-button ${showLagoonMoodControls ? "is-active" : ""}`} onClick={() => setShowLagoonMoodControls((current) => !current)}>
          {language === "ko" ? "무드" : "Mood"}
        </button>
        {showLagoonMoodControls ? (
          <div className="lagoon-mood-panel immersive-mood-popover">
            <label>
              <span>{language === "ko" ? `물빛 선명도 ${Math.round(lagoonClarity * 100)}%` : `Water clarity ${Math.round(lagoonClarity * 100)}%`}</span>
              <input type="range" min="0.3" max="0.95" step="0.01" value={lagoonClarity} onChange={(event) => setLagoonClarity(Number(event.target.value))} />
            </label>
            <label>
              <span>{language === "ko" ? `부유 흐름 ${Math.round(lagoonDrift * 100)}%` : `Drift motion ${Math.round(lagoonDrift * 100)}%`}</span>
              <input type="range" min="0.2" max="0.82" step="0.01" value={lagoonDrift} onChange={(event) => setLagoonDrift(Number(event.target.value))} />
            </label>
            <div className="time-jump-row rain-mood-presets">
              <button type="button" className={`focus-chip ${lagoonPreset === "shallow" ? "is-active" : ""}`} onClick={() => applyLagoonPreset("shallow")}>
                {language === "ko" ? "햇살 얕은 물결" : "Sunlit shallows"}
              </button>
              <button type="button" className={`focus-chip ${lagoonPreset === "balanced" ? "is-active" : ""}`} onClick={() => applyLagoonPreset("balanced")}>
                {language === "ko" ? "고요한 라군" : "Calm lagoon"}
              </button>
              <button type="button" className={`focus-chip ${lagoonPreset === "deep" ? "is-active" : ""}`} onClick={() => applyLagoonPreset("deep")}>
                {language === "ko" ? "푸른 심도" : "Blue depth"}
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <section className={`viewer-overlay lagoon-bottom-controls immersive-bottom-controls ${isFullscreen ? "is-hidden" : ""}`}>
        <label className="overlay-volume">
          <span>{language === "ko" ? "볼륨" : "Volume"}</span>
          <input type="range" min="0.5" max="1.15" step="0.05" value={ambientVolume} onChange={(event) => setAmbientVolume(Number(event.target.value))} />
          <strong>{Math.round(ambientVolume * 100)}%</strong>
        </label>
        <div className="aurora-live-quick-actions immersive-quick-actions">
          <button type="button" className={`overlay-button ${ambientEnabled ? "is-active" : ""}`} onClick={toggleAmbientSound}>
            {ambientEnabled ? (language === "ko" ? "사운드 끄기" : "Sound Off") : language === "ko" ? "사운드 켜기" : "Sound On"}
          </button>
          <button type="button" className={`overlay-button ${breathEnabled ? "is-active" : ""}`} onClick={toggleBreathSound}>
            {breathEnabled ? (language === "ko" ? "호흡 끄기" : "Breath Off") : language === "ko" ? "호흡 켜기" : "Breath On"}
          </button>
          <button type="button" className="overlay-button" onClick={toggleFullscreen}>
            {isFullscreen ? (language === "ko" ? "전체화면 종료" : "Exit fullscreen") : language === "ko" ? "전체화면" : "Fullscreen"}
          </button>
          <button type="button" className="overlay-button" onClick={closeLagoonViewer}>
            {language === "ko" ? "감상 종료" : "End Session"}
          </button>
        </div>
      </section>
    </div>
  );
}
