export function ViewerFocusOverlay({
  dictionary,
  language,
  constellationSearch,
  setConstellationSearch,
  focusedConstellation,
  setFocusedConstellation,
  focusConstellations,
  filteredConstellations,
  trackConstellation,
  setTrackConstellation,
  zoomLevel,
  setZoomLevel,
  changeZoom,
  resetView
}) {
  return (
    <div className="viewer-focus-overlay">
      <label className="overlay-focus-field">
        <span>{dictionary.viewer.searchConstellation}</span>
        <input
          type="text"
          value={constellationSearch}
          placeholder={dictionary.viewer.searchPlaceholder}
          onChange={(event) => setConstellationSearch(event.target.value)}
        />
      </label>
      <label className="overlay-focus-field">
        <span>{dictionary.viewer.focusConstellation}</span>
        <select value={focusedConstellation} onChange={(event) => setFocusedConstellation(event.target.value)}>
          <option value="all">{dictionary.viewer.allSky}</option>
          {(filteredConstellations.length ? filteredConstellations : focusConstellations).map((name) => (
            <option key={name} value={name}>
              {dictionary.constellations?.[name]?.[language] || name}
            </option>
          ))}
        </select>
      </label>
      <label className="overlay-track-toggle">
        <input
          type="checkbox"
          checked={trackConstellation}
          disabled={focusedConstellation === "all"}
          onChange={(event) => setTrackConstellation(event.target.checked)}
        />
        <span>{dictionary.viewer.trackConstellation}</span>
      </label>
      {focusedConstellation !== "all" ? (
        <button
          type="button"
          className="overlay-button"
          title={language === "ko" ? "선택 해제" : "Clear selection"}
          aria-label={language === "ko" ? "선택 해제" : "Clear selection"}
          onClick={() => {
            setFocusedConstellation("all");
            setTrackConstellation(false);
          }}
        >
          {language === "ko" ? "선택 해제" : "Clear selection"}
        </button>
      ) : null}
      <label className="overlay-zoom">
        <span>{dictionary.viewer.zoom}</span>
        <div className="overlay-zoom-controls">
          <button
            type="button"
            className="overlay-button overlay-icon-button"
            title={dictionary.viewer.zoomOut}
            aria-label={dictionary.viewer.zoomOut}
            onClick={() => changeZoom(-0.1)}
          >
            -
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={zoomLevel}
            aria-label={dictionary.viewer.zoom}
            onChange={(event) => setZoomLevel(Number(event.target.value))}
          />
          <button
            type="button"
            className="overlay-button overlay-icon-button"
            title={dictionary.viewer.zoomIn}
            aria-label={dictionary.viewer.zoomIn}
            onClick={() => changeZoom(0.1)}
          >
            +
          </button>
        </div>
      </label>
      <button
        type="button"
        className="overlay-button overlay-icon-button"
        title={dictionary.viewer.resetView}
        aria-label={dictionary.viewer.resetView}
        onClick={resetView}
      >
        R
      </button>
      <span className="overlay-shortcut-hint">{language === "ko" ? "R: 시점 초기화  ·  +/-: 줌" : "R: reset view  ·  +/-: zoom"}</span>
    </div>
  );
}

export function ViewerAmbientOverlay({
  dictionary,
  language,
  ambientTrackPending,
  ambientTrackError,
  ambientEnabled,
  ambientStatus,
  ambientStatusLabel,
  ambientStatusHint,
  ambientVolume,
  setAmbientVolume,
  isFullscreen,
  showHideControlsButton,
  onToggleControlsHidden,
  controlsHidden,
  toggleFullscreen,
  toggleAmbientSound
}) {
  return (
    <div className="viewer-overlay">
      {(ambientTrackPending || ambientTrackError || (ambientEnabled && ambientStatus !== "playing")) ? (
        <div className="overlay-ambient-status">
          <strong>{ambientStatusLabel}</strong>
          <span>{ambientStatusHint}</span>
        </div>
      ) : null}
      <label className="overlay-volume">
        <span>{dictionary.viewer.ambient.volumeShort}</span>
        <input
          type="range"
          min="0.35"
          max="1"
          step="0.05"
          value={ambientVolume}
          aria-label={dictionary.viewer.ambient.volume}
          onChange={(event) => setAmbientVolume(Number(event.target.value))}
        />
        <strong>{Math.round(ambientVolume * 100)}%</strong>
      </label>
      <button
        type="button"
        className="overlay-button overlay-icon-button"
        title={isFullscreen ? dictionary.viewer.exitFullscreen : dictionary.viewer.enterFullscreen}
        aria-label={isFullscreen ? dictionary.viewer.exitFullscreen : dictionary.viewer.enterFullscreen}
        onClick={toggleFullscreen}
      >
        {isFullscreen ? "[]-" : "[]+"}
      </button>
      {showHideControlsButton ? (
        <button
          type="button"
          className="overlay-button overlay-icon-button"
          title={controlsHidden ? (language === "ko" ? "컨트롤 보이기" : "Show UI") : language === "ko" ? "컨트롤 숨기기" : "Hide UI"}
          aria-label={controlsHidden ? (language === "ko" ? "컨트롤 보이기" : "Show UI") : language === "ko" ? "컨트롤 숨기기" : "Hide UI"}
          onClick={onToggleControlsHidden}
        >
          {controlsHidden ? "UI+" : "UI-"}
        </button>
      ) : null}
      <button
        type="button"
        className={`overlay-button overlay-icon-button ${ambientEnabled ? "is-active" : ""}`}
        title={ambientEnabled ? dictionary.viewer.ambient.off : dictionary.viewer.ambient.on}
        aria-label={ambientEnabled ? dictionary.viewer.ambient.off : dictionary.viewer.ambient.on}
        onClick={toggleAmbientSound}
      >
        {ambientEnabled ? "SND-" : "SND+"}
      </button>
    </div>
  );
}
