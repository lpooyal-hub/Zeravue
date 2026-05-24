function SketchControlsPanel({
  dictionary,
  language,
  viewMode,
  viewModeOrder,
  setViewMode,
  sketchViewDescription,
  creativeTool,
  setCreativeTool,
  addCustomConstellation,
  duplicateActiveConstellation,
  activeCustomConstellationStars,
  customSpace,
  setCustomSpace,
  presetConstellationName,
  setPresetConstellationName,
  importableConstellations,
  importPresetConstellation,
  nudgeActiveConstellation,
  scaleActiveConstellation,
  spreadActiveConstellation,
  rotateActiveConstellation,
  activeCustomConstellation,
  updateActiveConstellationName,
  updateActiveConstellationColor,
  removeActiveConstellation,
  planetPreset,
  setPlanetPreset,
  planetPresets,
  sketchName,
  setSketchName,
  activeSketchName,
  saveSketchLabel,
  startNewSketch,
  clearDraftSketch,
  saveDraftSketch,
  saveSketchAsNew
}) {
  const activeToolLabel = dictionary.viewer.creativeTools?.[creativeTool] || dictionary.viewer.addStarTool;
  const activeToolHint = dictionary.viewer.creativeToolHints?.[creativeTool] || dictionary.viewer.sketchHint;

  return (
    <section>
      <p className="eyebrow">{dictionary.viewer.sketchLab}</p>
      <div className="constellation-list focus-list">
        {viewModeOrder.map((mode) => (
          <button
            key={mode}
            type="button"
            className={`focus-chip ${viewMode === mode ? "is-active" : ""}`}
            onClick={() => setViewMode(mode)}
          >
            {dictionary.viewer.viewModes[mode]}
          </button>
        ))}
      </div>
      <p className="helper-copy">{sketchViewDescription}</p>

      <div className="toggle-grid">
        <button type="button" className={`focus-chip ${creativeTool === "star" ? "is-active" : ""}`} onClick={() => setCreativeTool("star")}>
          {dictionary.viewer.addStarTool}
        </button>
        <button type="button" className={`focus-chip ${creativeTool === "planet" ? "is-active" : ""}`} onClick={() => setCreativeTool("planet")}>
          {dictionary.viewer.addPlanetTool}
        </button>
        <button type="button" className={`focus-chip ${creativeTool === "delete" ? "is-active" : ""}`} onClick={() => setCreativeTool("delete")}>
          {dictionary.viewer.deleteTool}
        </button>
        <button
          type="button"
          className="focus-chip"
          onClick={() => {
            addCustomConstellation();
            setCreativeTool("star");
          }}
        >
          {dictionary.viewer.addConstellation}
        </button>
        <button type="button" className="focus-chip" onClick={duplicateActiveConstellation} disabled={activeCustomConstellationStars.length < 2}>
          {dictionary.viewer.duplicateConstellation}
        </button>
      </div>

      <div className="observer-moment-card">
        <strong>{dictionary.viewer.activeTool}</strong>
        <span>{activeToolLabel}</span>
        <small>{activeToolHint}</small>
      </div>

      <label className="stacked-field">
        <span>{dictionary.viewer.activeConstellation}</span>
        <select
          value={customSpace.activeConstellationId}
          onChange={(event) => setCustomSpace((current) => ({ ...current, activeConstellationId: event.target.value }))}
        >
          {customSpace.constellations.map((constellation) => (
            <option key={constellation.id} value={constellation.id}>
              {constellation.name}
            </option>
          ))}
        </select>
      </label>

      <div className="observer-moment-card">
        <strong>{activeCustomConstellation?.name || dictionary.viewer.activeConstellation}</strong>
        <span>
          {activeCustomConstellationStars.length} {dictionary.viewer.customStars}
        </span>
        <small>
          {activeCustomConstellationStars.length > 0
            ? dictionary.viewer.activeConstellationHintReady
            : dictionary.viewer.activeConstellationHintEmpty}
        </small>
      </div>

      <label className="stacked-field">
        <span>{dictionary.viewer.presetConstellation}</span>
        <select value={presetConstellationName} onChange={(event) => setPresetConstellationName(event.target.value)}>
          {importableConstellations.length === 0 ? (
            <option value="">{dictionary.viewer.noPresetConstellations}</option>
          ) : (
            importableConstellations.map((name) => (
              <option key={name} value={name}>
                {dictionary.constellations?.[name]?.[language] || name}
              </option>
            ))
          )}
        </select>
      </label>

      <button type="button" className="focus-chip" onClick={importPresetConstellation} disabled={!presetConstellationName}>
        {dictionary.viewer.importConstellation}
      </button>

      <p className="eyebrow section-subtle">{dictionary.viewer.arrangeTitle}</p>
      <div className="toggle-grid">
        <button type="button" className="focus-chip" onClick={() => nudgeActiveConstellation(-0.7, 0)} disabled={!activeCustomConstellationStars.length}>
          {dictionary.viewer.arrange.left}
        </button>
        <button type="button" className="focus-chip" onClick={() => nudgeActiveConstellation(0.7, 0)} disabled={!activeCustomConstellationStars.length}>
          {dictionary.viewer.arrange.right}
        </button>
        <button type="button" className="focus-chip" onClick={() => nudgeActiveConstellation(0, 0.7)} disabled={!activeCustomConstellationStars.length}>
          {dictionary.viewer.arrange.up}
        </button>
        <button type="button" className="focus-chip" onClick={() => nudgeActiveConstellation(0, -0.7)} disabled={!activeCustomConstellationStars.length}>
          {dictionary.viewer.arrange.down}
        </button>
        <button type="button" className="focus-chip" onClick={() => scaleActiveConstellation(1.14)} disabled={activeCustomConstellationStars.length < 2}>
          {dictionary.viewer.arrange.bigger}
        </button>
        <button type="button" className="focus-chip" onClick={() => scaleActiveConstellation(0.88)} disabled={activeCustomConstellationStars.length < 2}>
          {dictionary.viewer.arrange.smaller}
        </button>
        <button type="button" className="focus-chip" onClick={() => spreadActiveConstellation(1.12)} disabled={activeCustomConstellationStars.length < 2}>
          {dictionary.viewer.arrange.spread}
        </button>
        <button type="button" className="focus-chip" onClick={() => spreadActiveConstellation(0.9)} disabled={activeCustomConstellationStars.length < 2}>
          {dictionary.viewer.arrange.tighten}
        </button>
        <button type="button" className="focus-chip" onClick={() => rotateActiveConstellation(-12)} disabled={activeCustomConstellationStars.length < 2}>
          {dictionary.viewer.arrange.rotateLeft}
        </button>
        <button type="button" className="focus-chip" onClick={() => rotateActiveConstellation(12)} disabled={activeCustomConstellationStars.length < 2}>
          {dictionary.viewer.arrange.rotateRight}
        </button>
      </div>
      <p className="helper-copy">{dictionary.viewer.arrangeHint}</p>

      <label className="stacked-field">
        <span>{dictionary.viewer.constellationName}</span>
        <input type="text" value={activeCustomConstellation?.name || ""} onChange={(event) => updateActiveConstellationName(event.target.value)} />
      </label>

      <label className="stacked-field">
        <span>{dictionary.viewer.constellationColor}</span>
        <input type="color" value={activeCustomConstellation?.color || "#ffcf70"} onChange={(event) => updateActiveConstellationColor(event.target.value)} />
      </label>

      <dl className="summary-list compact">
        <div>
          <dt>{dictionary.viewer.activeConstellation}</dt>
          <dd>{activeCustomConstellation?.name || "--"}</dd>
        </div>
        <div>
          <dt>{dictionary.viewer.customStars}</dt>
          <dd>{activeCustomConstellationStars.length}</dd>
        </div>
      </dl>

      <button type="button" className="focus-chip" onClick={removeActiveConstellation} disabled={customSpace.constellations.length <= 1}>
        {dictionary.viewer.removeConstellation}
      </button>

      <label className="stacked-field">
        <span>{dictionary.viewer.planetStyle}</span>
        <select value={planetPreset} onChange={(event) => setPlanetPreset(event.target.value)} disabled={creativeTool !== "planet"}>
          {planetPresets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {dictionary.viewer.planetPresets[preset.id]}
            </option>
          ))}
        </select>
      </label>

      <label className="stacked-field">
        <span>{dictionary.viewer.sketchName}</span>
        <input type="text" value={sketchName} placeholder={dictionary.viewer.sketchPlaceholder} onChange={(event) => setSketchName(event.target.value)} />
      </label>

      <dl className="summary-list compact">
        <div>
          <dt>{dictionary.viewer.currentSketch}</dt>
          <dd>{activeSketchName}</dd>
        </div>
        <div>
          <dt>{dictionary.viewer.activeConstellation}</dt>
          <dd>{activeCustomConstellation?.name || "--"}</dd>
        </div>
        <div>
          <dt>{dictionary.viewer.customStars}</dt>
          <dd>{customSpace.stars.length}</dd>
        </div>
        <div>
          <dt>{dictionary.viewer.customPlanets}</dt>
          <dd>{customSpace.planets.length}</dd>
        </div>
      </dl>

      <div className="constellation-list">
        <button type="button" className="focus-chip" onClick={startNewSketch}>
          {dictionary.viewer.newSketch}
        </button>
        <button type="button" className="focus-chip" onClick={clearDraftSketch} disabled={customSpace.stars.length === 0 && customSpace.planets.length === 0}>
          {dictionary.viewer.clearSketch}
        </button>
        <button type="button" className="focus-chip is-active" onClick={saveDraftSketch} disabled={customSpace.stars.length === 0 && customSpace.planets.length === 0}>
          {saveSketchLabel}
        </button>
        <button type="button" className="focus-chip" onClick={saveSketchAsNew} disabled={customSpace.stars.length === 0 && customSpace.planets.length === 0}>
          {dictionary.viewer.saveSketchAsNew}
        </button>
      </div>

      <p className="helper-copy">{dictionary.viewer.sketchHint}</p>
    </section>
  );
}

function SketchLibraryPanel({
  dictionary,
  savedSketches,
  sortedSavedSketches,
  activeSketchId,
  loadSketch,
  renameSketch,
  toggleSketchFavorite,
  removeSketch
}) {
  return (
    <>
      <section>
        <p className="eyebrow">{dictionary.viewer.savedSketches}</p>
        <div className="saved-sketch-list">
          {savedSketches.length === 0 ? (
            <p className="helper-copy">{dictionary.viewer.noSavedSketches}</p>
          ) : (
            sortedSavedSketches.map((sketch) => (
              <div key={sketch.id} className={`saved-sketch-card ${activeSketchId === sketch.id ? "is-active" : ""}`}>
                <button type="button" className="saved-sketch-button" onClick={() => loadSketch(sketch.id)}>
                  <strong>{sketch.name}</strong>
                  <small>
                    {sketch.stars.length} {dictionary.viewer.customStars} / {sketch.planets.length} {dictionary.viewer.customPlanets}
                  </small>
                </button>
                <div className="saved-sketch-actions">
                  <button type="button" className="focus-chip" onClick={() => renameSketch(sketch.id)}>
                    {dictionary.viewer.renameSketch}
                  </button>
                  <button type="button" className={`focus-chip ${sketch.favorite ? "is-active" : ""}`} onClick={() => toggleSketchFavorite(sketch.id)}>
                    {sketch.favorite ? dictionary.viewer.unpinSketch : dictionary.viewer.pinSketch}
                  </button>
                  <button type="button" className="focus-chip" onClick={() => removeSketch(sketch.id)}>
                    {dictionary.viewer.deleteSketch}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
      <section>
        <p className="eyebrow">{dictionary.viewer.sketchTips}</p>
        <div className="constellation-list">
          <span>{dictionary.viewer.sketchTipsList.pick}</span>
          <span>{dictionary.viewer.sketchTipsList.order}</span>
          <span>{dictionary.viewer.sketchTipsList.save}</span>
        </div>
      </section>
    </>
  );
}

export { SketchControlsPanel, SketchLibraryPanel };
