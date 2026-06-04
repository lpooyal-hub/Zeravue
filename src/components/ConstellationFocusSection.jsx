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
      <section className="panel-collapsible-section">
        <details className="panel-collapsible">
          <summary>
            <span className="eyebrow">{dictionary.viewer.constellationFocus}</span>
            <strong>{activeConstellationName || dictionary.viewer.allSky}</strong>
          </summary>
          <div className="panel-collapsible-body">
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
          </div>
        </details>
      </section>
      <section className="panel-collapsible-section">
        <details className="panel-collapsible">
          <summary>
            <span className="eyebrow">{dictionary.viewer.favoriteConstellations}</span>
            <strong>
              {visibleFavoriteConstellations.length
                ? language === "ko"
                  ? `${visibleFavoriteConstellations.length}개 저장됨`
                  : `${visibleFavoriteConstellations.length} saved`
                : language === "ko"
                  ? "비어 있음"
                  : "Empty"}
            </strong>
          </summary>
          <div className="panel-collapsible-body">
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
          </div>
        </details>
      </section>
    </>
  );
}
