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
  changeZoom
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
          <button type="button" className="overlay-button" onClick={() => changeZoom(-0.1)}>
            {dictionary.viewer.zoomOut}
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
          <button type="button" className="overlay-button" onClick={() => changeZoom(0.1)}>
            {dictionary.viewer.zoomIn}
          </button>
        </div>
      </label>
    </div>
  );
}

export function ViewerAmbientOverlay({
  dictionary,
  ambientTrackPending,
  ambientTrackError,
  ambientEnabled,
  ambientStatus,
  ambientStatusLabel,
  ambientStatusHint,
  ambientVolume,
  setAmbientVolume,
  isFullscreen,
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
      <button type="button" className="overlay-button" onClick={toggleFullscreen}>
        {isFullscreen ? dictionary.viewer.exitFullscreen : dictionary.viewer.enterFullscreen}
      </button>
      <button type="button" className={`overlay-button ${ambientEnabled ? "is-active" : ""}`} onClick={toggleAmbientSound}>
        {ambientEnabled ? dictionary.viewer.ambient.off : dictionary.viewer.ambient.on}
      </button>
    </div>
  );
}
