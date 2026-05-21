export function ConstellationFocusSection({
  dictionary,
  language,
  focusedConstellation,
  setFocusedConstellation,
  trackConstellation,
  setTrackConstellation,
  activeConstellationKey,
  activeConstellationName,
  activeConstellationIsFavorite,
  toggleFavoriteConstellation,
  visibleFavoriteConstellations
}) {
  return (
    <>
      <section>
        <p className="eyebrow">{dictionary.viewer.constellationFocus}</p>
        <div className="summary-list compact">
          <div>
            <dt>{dictionary.viewer.focusConstellation}</dt>
            <dd>{activeConstellationName || dictionary.viewer.allSky}</dd>
          </div>
        </div>
        <label className="toggle-item">
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
            className="focus-chip"
            onClick={() => {
              setFocusedConstellation("all");
              setTrackConstellation(false);
            }}
          >
            {language === "ko" ? "선택 해제" : "Clear selection"}
          </button>
        ) : null}
        {activeConstellationKey ? (
          <button
            type="button"
            className={`focus-chip ${activeConstellationIsFavorite ? "is-active" : ""}`}
            onClick={() => toggleFavoriteConstellation(activeConstellationKey)}
          >
            {activeConstellationIsFavorite ? dictionary.viewer.removeFavorite : dictionary.viewer.addFavorite}
          </button>
        ) : null}
        <p className="helper-copy">
          {language === "ko"
            ? "별자리 검색과 선택은 화면 안 오버레이에서 바로 할 수 있습니다."
            : "Use the in-scene overlay to search for and choose a constellation."}
        </p>
      </section>
      <section>
        <p className="eyebrow">{dictionary.viewer.favoriteConstellations}</p>
        {visibleFavoriteConstellations.length ? (
          <div className="constellation-list focus-list">
            {visibleFavoriteConstellations.map((name) => (
              <button
                key={name}
                type="button"
                className={`focus-chip ${focusedConstellation === name ? "is-active" : ""}`}
                onClick={() => setFocusedConstellation(name)}
              >
                {dictionary.constellations?.[name]?.[language] || name}
              </button>
            ))}
          </div>
        ) : (
          <p className="helper-copy">{dictionary.viewer.noFavoriteConstellations}</p>
        )}
      </section>
    </>
  );
}
