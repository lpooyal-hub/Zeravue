function SelectionInspectorPanel({
  dictionary,
  language,
  currentPage,
  selectedCustomStar,
  selectedCustomConstellation,
  activeCustomConstellation,
  updateCustomObject,
  selectedTarget,
  customSpace,
  removeCustomObject,
  selectedCustomPlanet,
  selectedStar
}) {
  return (
    <section>
      <p className="eyebrow">{currentPage === "watch" ? dictionary.viewer.starInspector : dictionary.viewer.creationInspector}</p>
      {currentPage === "sketch" && selectedCustomStar ? (
        <>
          <h2>{selectedCustomStar.name}</h2>
          <p className="constellation-copy">{activeCustomConstellation?.name || dictionary.viewer.customConstellation}</p>
          <label className="stacked-field">
            <span>{dictionary.viewer.objectName}</span>
            <input type="text" value={selectedCustomStar.name} onChange={(event) => updateCustomObject(selectedTarget, { name: event.target.value })} />
          </label>
          <label className="stacked-field">
            <span>
              {dictionary.viewer.objectSize}: {selectedCustomStar.size.toFixed(2)}
            </span>
            <input
              type="range"
              min="0.7"
              max="2.8"
              step="0.05"
              value={selectedCustomStar.size}
              onChange={(event) => updateCustomObject(selectedTarget, { size: Number(event.target.value) })}
            />
          </label>
          <label className="stacked-field">
            <span>{dictionary.viewer.objectColor}</span>
            <input type="color" value={selectedCustomStar.color} onChange={(event) => updateCustomObject(selectedTarget, { color: event.target.value })} />
          </label>
          <dl className="summary-list compact">
            <div>
              <dt>{dictionary.viewer.type}</dt>
              <dd>{dictionary.viewer.customStar}</dd>
            </div>
            <div>
              <dt>{dictionary.viewer.belongsTo}</dt>
              <dd>
                {customSpace.constellations.find((constellation) => constellation.id === selectedCustomStar.constellationId)?.name ||
                  dictionary.viewer.customConstellation}
              </dd>
            </div>
          </dl>
          <button type="button" className="focus-chip" onClick={() => removeCustomObject(selectedTarget)}>
            {dictionary.viewer.removeObject}
          </button>
        </>
      ) : currentPage === "sketch" && selectedCustomPlanet ? (
        <>
          <h2>{selectedCustomPlanet.name}</h2>
          <p className="constellation-copy">{dictionary.viewer.customPlanet}</p>
          <label className="stacked-field">
            <span>{dictionary.viewer.objectName}</span>
            <input type="text" value={selectedCustomPlanet.name} onChange={(event) => updateCustomObject(selectedTarget, { name: event.target.value })} />
          </label>
          <label className="stacked-field">
            <span>
              {dictionary.viewer.objectSize}: {selectedCustomPlanet.size.toFixed(2)}
            </span>
            <input
              type="range"
              min="0.9"
              max="4"
              step="0.05"
              value={selectedCustomPlanet.size}
              onChange={(event) => updateCustomObject(selectedTarget, { size: Number(event.target.value) })}
            />
          </label>
          <label className="stacked-field">
            <span>{dictionary.viewer.objectColor}</span>
            <input type="color" value={selectedCustomPlanet.color} onChange={(event) => updateCustomObject(selectedTarget, { color: event.target.value })} />
          </label>
          <label className="toggle-item">
            <input type="checkbox" checked={selectedCustomPlanet.ring} onChange={(event) => updateCustomObject(selectedTarget, { ring: event.target.checked })} />
            <span>{dictionary.viewer.planetRing}</span>
          </label>
          <dl className="summary-list compact">
            <div>
              <dt>{dictionary.viewer.type}</dt>
              <dd>{selectedCustomPlanet.ring ? dictionary.viewer.ringedPlanet : dictionary.viewer.customPlanet}</dd>
            </div>
            <div>
              <dt>{dictionary.viewer.planetStyle}</dt>
              <dd>{selectedCustomPlanet.color}</dd>
            </div>
          </dl>
          <button type="button" className="focus-chip" onClick={() => removeCustomObject(selectedTarget)}>
            {dictionary.viewer.removeObject}
          </button>
        </>
      ) : currentPage === "sketch" && selectedCustomConstellation ? (
        <>
          <h2>{selectedCustomConstellation.name}</h2>
          <p className="constellation-copy">{dictionary.viewer.customConstellation}</p>
          <label className="stacked-field">
            <span>{dictionary.viewer.constellationName}</span>
            <input type="text" value={selectedCustomConstellation.name} readOnly />
          </label>
          <dl className="summary-list compact">
            <div>
              <dt>{dictionary.viewer.type}</dt>
              <dd>{dictionary.viewer.customConstellation}</dd>
            </div>
            <div>
              <dt>{dictionary.viewer.customStars}</dt>
              <dd>{selectedCustomConstellation.starIds.length}</dd>
            </div>
          </dl>
          <p className="helper-copy">{dictionary.viewer.constellationDragHint}</p>
        </>
      ) : currentPage === "watch" && selectedStar ? (
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
        </>
      ) : (
        <p className="helper-copy">{currentPage === "watch" ? dictionary.viewer.pickHint : dictionary.viewer.creationPickHint}</p>
      )}
    </section>
  );
}

export { SelectionInspectorPanel };
