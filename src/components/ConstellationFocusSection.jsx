export function ConstellationFocusSection({
  dictionary,
  language,
  focusedConstellation,
  setFocusedConstellation,
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
            ? "검색, 추적, 선택 해제는 화면 안 오버레이에서 바로 할 수 있습니다."
            : "Use the in-scene overlay for searching, tracking, and clearing selections."}
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
