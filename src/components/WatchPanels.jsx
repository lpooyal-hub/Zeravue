import { ConstellationFocusSection } from "./ConstellationFocusSection.jsx";

function getCompassDirectionLabel(azimuth, dictionary, language) {
  if (typeof azimuth !== "number") {
    return "--";
  }

  const labels = [
    dictionary.viewer.cardinals.north[language],
    language === "ko"
      ? `${dictionary.viewer.cardinals.north[language]}${dictionary.viewer.cardinals.east[language]}`
      : "North-east",
    dictionary.viewer.cardinals.east[language],
    language === "ko"
      ? `${dictionary.viewer.cardinals.south[language]}${dictionary.viewer.cardinals.east[language]}`
      : "South-east",
    dictionary.viewer.cardinals.south[language],
    language === "ko"
      ? `${dictionary.viewer.cardinals.south[language]}${dictionary.viewer.cardinals.west[language]}`
      : "South-west",
    dictionary.viewer.cardinals.west[language],
    language === "ko"
      ? `${dictionary.viewer.cardinals.north[language]}${dictionary.viewer.cardinals.west[language]}`
      : "North-west"
  ];

  const normalized = ((azimuth % 360) + 360) % 360;
  const index = Math.round(normalized / 45) % 8;
  return labels[index];
}

function getAltitudeBandLabel(altitude, dictionary) {
  if (typeof altitude !== "number") {
    return "--";
  }

  if (altitude >= 60) {
    return dictionary.viewer.altitudeBands.high;
  }
  if (altitude >= 35) {
    return dictionary.viewer.altitudeBands.mid;
  }
  return dictionary.viewer.altitudeBands.low;
}

function WatchControlsPanel({
  dictionary,
  language,
  observedAt,
  setObservedAt,
  shiftTime,
  setTonightTimestamp,
  viewMode,
  observerMomentLabel,
  observerFocusSummary,
  setObserverHourTimestamp,
  observer,
  updateObserver,
  requestLocation,
  viewModeOrder,
  setViewMode,
  focusedConstellation,
  setFocusedConstellation,
  activeConstellationKey,
  activeConstellationName,
  activeConstellationIsFavorite,
  toggleFavoriteConstellation,
  visibleFavoriteConstellations,
  activeConstellationStory,
  activeConstellationStats,
  atmosphereStrength,
  setAtmosphereStrength,
  starGlowStrength,
  setStarGlowStrength,
  limitingMagnitude,
  setLimitingMagnitude,
  maxStars,
  setMaxStars,
  showConstellations,
  setShowConstellations,
  showLabels,
  setShowLabels,
  autoRotate,
  setAutoRotate,
  showGuides,
  setShowGuides,
  auroraEnabled,
  auroraIntensity,
  setAuroraIntensity,
  auroraSpeed,
  setAuroraSpeed,
  isSketchWatch,
  activeSketchWatchName,
  watchedSketchSummary,
  exitSketchWatch
}) {
  return (
    <>
      {isSketchWatch ? (
        <section>
          <p className="eyebrow">{dictionary.viewer.watchingSketchTitle}</p>
          <div className="observer-moment-card">
            <strong>{activeSketchWatchName}</strong>
            <small>{dictionary.viewer.watchingSketchHint}</small>
          </div>
          {watchedSketchSummary ? (
            <dl className="summary-list compact">
              <div>
                <dt>{dictionary.viewer.customStars}</dt>
                <dd>{watchedSketchSummary.stars}</dd>
              </div>
              <div>
                <dt>{dictionary.viewer.customPlanets}</dt>
                <dd>{watchedSketchSummary.planets}</dd>
              </div>
              <div>
                <dt>{dictionary.viewer.customConstellationsCount}</dt>
                <dd>{watchedSketchSummary.constellations}</dd>
              </div>
            </dl>
          ) : null}
          <button className="primary-button" type="button" onClick={exitSketchWatch}>
            {dictionary.viewer.returnLiveSky}
          </button>
        </section>
      ) : null}
      <section>
        <p className="eyebrow">{dictionary.viewer.controls}</p>
        <label className="stacked-field">
          <span>{dictionary.viewer.observedAt}</span>
          <input type="datetime-local" value={observedAt} onChange={(event) => setObservedAt(event.target.value)} />
        </label>
        <div className="time-jump-row">
          <button type="button" className="focus-chip" onClick={() => shiftTime(-3)}>
            {dictionary.viewer.timeJump.back}
          </button>
          <button type="button" className="focus-chip" onClick={() => setObservedAt((current) => setTonightTimestamp(current))}>
            {dictionary.viewer.timeJump.tonight}
          </button>
          <button type="button" className="focus-chip" onClick={() => shiftTime(3)}>
            {dictionary.viewer.timeJump.forward}
          </button>
        </div>
        {viewMode === "observer" ? (
          <>
            <div className="observer-moment-card">
              <strong>{language === "ko" ? "현재 관측 시각" : "Observer time"}</strong>
              <span>{observerMomentLabel}</span>
              <small>
                {language === "ko"
                  ? "시간을 바꾸면 지평선 위 별자리 위치가 함께 이동합니다."
                  : "Changing the time shifts where constellations sit above the horizon."}
              </small>
            </div>
            <div className="constellation-list focus-list">
              <button type="button" className="focus-chip" onClick={() => setObservedAt((current) => setObserverHourTimestamp(current, 21))}>
                {language === "ko" ? "초저녁 21:00" : "9 PM"}
              </button>
              <button type="button" className="focus-chip" onClick={() => setObservedAt((current) => setObserverHourTimestamp(current, 0))}>
                {language === "ko" ? "한밤중 00:00" : "12 AM"}
              </button>
              <button type="button" className="focus-chip" onClick={() => setObservedAt((current) => setObserverHourTimestamp(current, 3))}>
                {language === "ko" ? "새벽 03:00" : "3 AM"}
              </button>
            </div>
            {observerFocusSummary ? (
              <div className="observer-moment-card">
                <strong>{dictionary.viewer.observerCue}</strong>
                <span>{observerFocusSummary.name}</span>
                <small>
                  {dictionary.viewer.lookingToward}: {getCompassDirectionLabel(observerFocusSummary.azimuth, dictionary, language)} ·{" "}
                  {dictionary.viewer.altitude} {observerFocusSummary.altitude}°
                </small>
              </div>
            ) : null}
          </>
        ) : null}
        <div className="field-grid">
          <label>
            <span>{dictionary.viewer.latitude}</span>
            <input
              type="number"
              min="-90"
              max="90"
              step="0.01"
              value={observer.latitude}
              onChange={(event) => updateObserver("latitude", event.target.value)}
            />
          </label>
          <label>
            <span>{dictionary.viewer.longitude}</span>
            <input
              type="number"
              min="-180"
              max="180"
              step="0.01"
              value={observer.longitude}
              onChange={(event) => updateObserver("longitude", event.target.value)}
            />
          </label>
        </div>
        <button className="primary-button" type="button" onClick={requestLocation}>
          {dictionary.viewer.useLocation}
        </button>
      </section>

      <section>
        <p className="eyebrow">{dictionary.viewer.viewModeLabel}</p>
        <div className="constellation-list focus-list">
          {viewModeOrder.map((mode) => (
            <button key={mode} type="button" className={`focus-chip ${viewMode === mode ? "is-active" : ""}`} onClick={() => setViewMode(mode)}>
              {dictionary.viewer.viewModes[mode]}
            </button>
          ))}
        </div>
        <p className="helper-copy">{dictionary.viewer.viewModeDescriptions[viewMode]}</p>
      </section>

      <ConstellationFocusSection
        dictionary={dictionary}
        language={language}
        focusedConstellation={focusedConstellation}
        setFocusedConstellation={setFocusedConstellation}
        activeConstellationKey={activeConstellationKey}
        activeConstellationName={activeConstellationName}
        activeConstellationIsFavorite={activeConstellationIsFavorite}
        toggleFavoriteConstellation={toggleFavoriteConstellation}
        visibleFavoriteConstellations={visibleFavoriteConstellations}
      />

      <section className="story-card">
        <p className="eyebrow">{dictionary.viewer.tonightMood}</p>
        <h2>{activeConstellationName || dictionary.viewer.allSky}</h2>
        <p>{activeConstellationStory}</p>
        {activeConstellationStats ? (
          <dl className="summary-list compact">
            <div>
              <dt>{dictionary.viewer.constellationVisibleStars}</dt>
              <dd>{activeConstellationStats.visibleStars}</dd>
            </div>
            <div>
              <dt>{dictionary.viewer.brightestStar}</dt>
              <dd>{activeConstellationStats.brightestStar || "--"}</dd>
            </div>
            <div>
              <dt>{dictionary.viewer.magnitude}</dt>
              <dd>{activeConstellationStats.brightestMagnitude ?? "--"}</dd>
            </div>
          </dl>
        ) : null}
      </section>

      <section>
        <p className="eyebrow">{dictionary.viewer.atmosphere}</p>
        <label className="stacked-field">
          <span>
            {dictionary.viewer.atmosphereDensity}: {Math.round(atmosphereStrength * 100)}%
          </span>
          <input type="range" min="0.2" max="1" step="0.05" value={atmosphereStrength} onChange={(event) => setAtmosphereStrength(Number(event.target.value))} />
        </label>
        <label className="stacked-field">
          <span>
            {dictionary.viewer.starGlow}: {Math.round(starGlowStrength * 100)}%
          </span>
          <input type="range" min="0.2" max="1" step="0.05" value={starGlowStrength} onChange={(event) => setStarGlowStrength(Number(event.target.value))} />
        </label>
        <label className="stacked-field">
          <span>
            {dictionary.viewer.limitingMagnitude}: {limitingMagnitude.toFixed(1)}
          </span>
          <input type="range" min="3" max="6" step="0.1" value={limitingMagnitude} onChange={(event) => setLimitingMagnitude(Number(event.target.value))} />
        </label>
        <label className="stacked-field">
          <span>
            {dictionary.viewer.maxStars}: {maxStars.toLocaleString()}
          </span>
          <input type="range" min="1800" max="6000" step="200" value={maxStars} onChange={(event) => setMaxStars(Number(event.target.value))} />
        </label>
        <div className="toggle-grid">
          <label className="toggle-item">
            <input type="checkbox" checked={showConstellations} onChange={(event) => setShowConstellations(event.target.checked)} />
            <span>{dictionary.viewer.toggles.constellations}</span>
          </label>
          <label className="toggle-item">
            <input type="checkbox" checked={showLabels} onChange={(event) => setShowLabels(event.target.checked)} />
            <span>{dictionary.viewer.toggles.labels}</span>
          </label>
          <label className="toggle-item">
            <input type="checkbox" checked={autoRotate} onChange={(event) => setAutoRotate(event.target.checked)} />
            <span>{dictionary.viewer.toggles.autoRotate}</span>
          </label>
          <label className="toggle-item">
            <input type="checkbox" checked={showGuides} onChange={(event) => setShowGuides(event.target.checked)} />
            <span>{dictionary.viewer.toggles.guides}</span>
          </label>
        </div>
      </section>
      {auroraEnabled ? (
        <section>
          <p className="eyebrow">{language === "ko" ? "오로라 분위기" : "Aurora mood"}</p>
          <label className="stacked-field">
            <span>{language === "ko" ? `오로라 강도: ${Math.round(auroraIntensity * 100)}%` : `Aurora intensity: ${Math.round(auroraIntensity * 100)}%`}</span>
            <input type="range" min="0.2" max="1" step="0.02" value={auroraIntensity} onChange={(event) => setAuroraIntensity(Number(event.target.value))} />
          </label>
          <label className="stacked-field">
            <span>{language === "ko" ? `오로라 흐름 속도: ${Math.round(auroraSpeed * 100)}%` : `Aurora drift speed: ${Math.round(auroraSpeed * 100)}%`}</span>
            <input type="range" min="0.2" max="1" step="0.02" value={auroraSpeed} onChange={(event) => setAuroraSpeed(Number(event.target.value))} />
          </label>
        </section>
      ) : null}
    </>
  );
}

function WatchInspectorPanel({
  dictionary,
  language,
  selectedStar,
  currentViewConstellationDetails,
  focusedConstellation,
  setFocusedConstellation,
  focusConstellations,
  sceneState,
  viewMode,
  isSketchWatch
}) {
  return (
    <>
      <section className="view-constellations-section">
        <p className="eyebrow">{dictionary.viewer.constellationsInFrame}</p>
        {isSketchWatch ? (
          <p className="helper-copy">{dictionary.viewer.watchingSketchHint}</p>
        ) : viewMode === "observer" ? (
          <p className="helper-copy">{dictionary.viewer.observerConstellationHint}</p>
        ) : (
          <p className="helper-copy">
            {language === "ko" ? "별자리를 누르면 바로 강조됩니다." : "Click any constellation below to focus it instantly."}
          </p>
        )}
        <div className="saved-sketch-list constellation-frame-list">
          {currentViewConstellationDetails.map((item) => (
            <button
              key={item.name}
              type="button"
              className={`saved-sketch-card saved-sketch-button ${focusedConstellation === item.name ? "is-active" : ""}`}
              onClick={() => setFocusedConstellation(item.name)}
            >
              <strong>{dictionary.constellations?.[item.name]?.[language] || item.name}</strong>
              <small>
                {item.visibleStars} {dictionary.viewer.constellationVisibleStars} · {dictionary.viewer.altitude} {item.averageAltitude}°
                {viewMode === "observer"
                  ? ` · ${dictionary.viewer.lookingToward} ${getCompassDirectionLabel(item.averageAzimuth, dictionary, language)}`
                  : ""}
              </small>
              {viewMode === "observer" ? <small>{getAltitudeBandLabel(item.averageAltitude, dictionary)}</small> : null}
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="eyebrow">{dictionary.viewer.starInspector}</p>
        {selectedStar ? (
          <>
            <h2>{selectedStar.name}</h2>
            <p className="constellation-copy">{dictionary.constellations?.[selectedStar.constellation]?.[language] || selectedStar.constellation}</p>
            <dl className="summary-list compact">
              <div>
                <dt>{dictionary.viewer.magnitude}</dt>
                <dd>{selectedStar.magnitude}</dd>
              </div>
              <div>
                <dt>{dictionary.viewer.altitude}</dt>
                <dd>{selectedStar.altitude} deg</dd>
              </div>
              <div>
                <dt>{dictionary.viewer.azimuth}</dt>
                <dd>{selectedStar.azimuth} deg</dd>
              </div>
              <div>
                <dt>{dictionary.viewer.visibility}</dt>
                <dd>{selectedStar.visible ? dictionary.viewer.aboveHorizon : dictionary.viewer.belowHorizon}</dd>
              </div>
            </dl>
            {viewMode === "observer" ? (
              <div className="observer-moment-card">
                <strong>{dictionary.viewer.observerCue}</strong>
                <span>
                  {dictionary.viewer.lookingToward} {getCompassDirectionLabel(selectedStar.azimuth, dictionary, language)}
                </span>
                <small>{getAltitudeBandLabel(selectedStar.altitude, dictionary)}</small>
              </div>
            ) : null}
          </>
        ) : (
          <p className="helper-copy">{dictionary.viewer.pickHint}</p>
        )}
      </section>

      {!isSketchWatch && sceneState.error ? <p className="error-copy">{sceneState.error}</p> : null}
    </>
  );
}

export { WatchControlsPanel, WatchInspectorPanel };
