import { useEffect, useMemo, useRef, useState } from "react";
import { getSkyScene } from "./api/backend.js";
import { PlanetariumCanvas } from "./components/PlanetariumCanvas.jsx";
import { getInitialLanguage, translations } from "./data/i18n.js";
import { planets } from "./data/planets.js";

const SKETCH_STORAGE_KEY = "planetarium-sketches";

const defaultObserver = {
  latitude: 37.5665,
  longitude: 126.978,
  label: "Seoul"
};

function getInitialObservedAt() {
  return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function App() {
  const viewerRef = useRef(null);
  const [currentPage, setCurrentPage] = useState("watch");
  const [language, setLanguage] = useState(getInitialLanguage);
  const [observer, setObserver] = useState(defaultObserver);
  const [observedAt, setObservedAt] = useState(getInitialObservedAt);
  const [limitingMagnitude, setLimitingMagnitude] = useState(4.8);
  const [maxStars, setMaxStars] = useState(3200);
  const [sceneState, setSceneState] = useState({ status: "loading", data: null, error: "" });
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [showLabels, setShowLabels] = useState(true);
  const [showGuides, setShowGuides] = useState(true);
  const [showConstellations, setShowConstellations] = useState(true);
  const [showPlanets, setShowPlanets] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [focusedConstellation, setFocusedConstellation] = useState("all");
  const [drawMode, setDrawMode] = useState(false);
  const [sketchName, setSketchName] = useState("");
  const [savedSketches, setSavedSketches] = useState([]);
  const [activeSketchId, setActiveSketchId] = useState("draft");
  const [draftSketchStarIds, setDraftSketchStarIds] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const dictionary = translations[language];

  useEffect(() => {
    const saved = window.localStorage.getItem(SKETCH_STORAGE_KEY);
    if (!saved) {
      return;
    }

    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        setSavedSketches(parsed);
      }
    } catch (error) {
      console.warn("Failed to restore saved sketches:", error);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem("planetarium-language", language);
  }, [language]);

  useEffect(() => {
    window.localStorage.setItem(SKETCH_STORAGE_KEY, JSON.stringify(savedSketches));
  }, [savedSketches]);

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadScene() {
      setSceneState((current) => ({ ...current, status: "loading", error: "" }));

      try {
        const data = await getSkyScene({
          latitude: observer.latitude,
          longitude: observer.longitude,
          observedAt: new Date(observedAt).toISOString(),
          limitingMagnitude,
          maxStars
        });

        if (cancelled) {
          return;
        }

        setSceneState({ status: "ready", data, error: "" });
        setSelectedTarget((current) => current || { kind: "star", id: data.stars.find((star) => star.visible)?.id || data.stars[0]?.id || null });
      } catch (error) {
        if (cancelled) {
          return;
        }

        setSceneState({ status: "error", data: null, error: error.message || "Failed to load the scene." });
      }
    }

    loadScene();

    return () => {
      cancelled = true;
    };
  }, [observer.latitude, observer.longitude, observedAt, limitingMagnitude, maxStars]);

  const selectedStar = useMemo(
    () => (selectedTarget?.kind === "star" ? sceneState.data?.stars.find((star) => star.id === selectedTarget.id) || null : null),
    [sceneState.data, selectedTarget]
  );
  const selectedPlanet = useMemo(
    () => (selectedTarget?.kind === "planet" ? planets.find((planet) => planet.name === selectedTarget.id) || null : null),
    [selectedTarget]
  );
  const visibleConstellations = sceneState.data?.summary.visibleConstellations || [];
  const activeSketch = useMemo(() => savedSketches.find((sketch) => sketch.id === activeSketchId) || null, [activeSketchId, savedSketches]);
  const displayedSketchStarIds = drawMode ? draftSketchStarIds : activeSketch?.starIds || draftSketchStarIds;
  const activeSketchName = drawMode ? (sketchName.trim() || dictionary.viewer.draftSketch) : activeSketch?.name || dictionary.viewer.draftSketch;

  function updateObserver(key, value) {
    setObserver((current) => ({
      ...current,
      [key]: Number(value),
      label: "Custom observer"
    }));
  }

  function requestLocation() {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition((position) => {
      setObserver({
        latitude: Number(position.coords.latitude.toFixed(4)),
        longitude: Number(position.coords.longitude.toFixed(4)),
        label: "Live location"
      });
    });
  }

  function selectTarget(target) {
    if (drawMode && target?.kind === "star") {
      setDraftSketchStarIds((current) => {
        if (current[current.length - 1] === target.id) {
          return current;
        }

        if (current.includes(target.id)) {
          return current.filter((starId) => starId !== target.id);
        }

        return [...current, target.id];
      });
      return;
    }

    setSelectedTarget(target);

    if (target?.kind === "star") {
      const star = sceneState.data?.stars.find((item) => item.id === target.id);
      if (star?.constellation) {
        setFocusedConstellation(star.constellation);
      }
    }
  }

  function startNewSketch() {
    setDrawMode(true);
    setActiveSketchId("draft");
    setDraftSketchStarIds([]);
    setSketchName("");
  }

  function clearDraftSketch() {
    setDraftSketchStarIds([]);
  }

  function saveDraftSketch() {
    if (draftSketchStarIds.length < 2) {
      return;
    }

    const name = sketchName.trim() || `${dictionary.viewer.savedSketch} ${savedSketches.length + 1}`;
    const sketchId = `sketch-${Date.now()}`;
    const nextSketch = { id: sketchId, name, starIds: draftSketchStarIds };
    setSavedSketches((current) => [nextSketch, ...current]);
    setActiveSketchId(sketchId);
    setDrawMode(false);
    setSketchName("");
  }

  function loadSketch(sketchId) {
    setActiveSketchId(sketchId);
    setDrawMode(false);
  }

  function removeSketch(sketchId) {
    setSavedSketches((current) => current.filter((sketch) => sketch.id !== sketchId));
    if (activeSketchId === sketchId) {
      setActiveSketchId("draft");
    }
  }

  async function toggleFullscreen() {
    if (!viewerRef.current) {
      return;
    }

    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await viewerRef.current.requestFullscreen();
  }

  return (
    <div className="planetarium-app">
      <header className="topbar">
        <div>
          <p className="eyebrow">{dictionary.viewer.eyebrow}</p>
          <h1>{dictionary.viewer.title}</h1>
        </div>
        <div className="topbar-controls">
          <div className="page-switcher" aria-label={dictionary.viewer.pageMode}>
            <button type="button" aria-pressed={currentPage === "watch"} onClick={() => setCurrentPage("watch")}>
              {dictionary.viewer.pages.watch}
            </button>
            <button type="button" aria-pressed={currentPage === "sketch"} onClick={() => setCurrentPage("sketch")}>
              {dictionary.viewer.pages.sketch}
            </button>
          </div>
          <div className="language-switcher" aria-label="Language">
            <button type="button" aria-pressed={language === "en"} onClick={() => setLanguage("en")}>
              EN
            </button>
            <button type="button" aria-pressed={language === "ko"} onClick={() => setLanguage("ko")}>
              KR
            </button>
          </div>
        <div className="observer-pill">
          <span>{dictionary.viewer.observer}</span>
          <strong>{observer.label}</strong>
          <small>
            {observer.latitude.toFixed(2)}, {observer.longitude.toFixed(2)}
          </small>
        </div>
        </div>
      </header>

      <div className="workspace">
        <aside className="control-panel">
          <section>
            <p className="eyebrow">{currentPage === "watch" ? dictionary.viewer.controls : dictionary.viewer.sketchControls}</p>
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
            <label className="stacked-field">
              <span>{dictionary.viewer.observedAt}</span>
              <input type="datetime-local" value={observedAt} onChange={(event) => setObservedAt(event.target.value)} />
            </label>
            <label className="stacked-field">
              <span>
                {dictionary.viewer.limitingMagnitude}: {limitingMagnitude.toFixed(1)}
              </span>
              <input
                type="range"
                min="1"
                max="6"
                step="0.1"
                value={limitingMagnitude}
                onChange={(event) => setLimitingMagnitude(Number(event.target.value))}
              />
            </label>
            <label className="stacked-field">
              <span>
                {dictionary.viewer.maxStars}: {maxStars.toLocaleString()}
              </span>
              <input
                type="range"
                min="1000"
                max="6000"
                step="200"
                value={maxStars}
                onChange={(event) => setMaxStars(Number(event.target.value))}
              />
            </label>
            <div className="toggle-grid">
              <label className="toggle-item">
                <input type="checkbox" checked={showLabels} onChange={(event) => setShowLabels(event.target.checked)} />
                <span>{dictionary.viewer.toggles.labels}</span>
              </label>
              <label className="toggle-item">
                <input
                  type="checkbox"
                  checked={showConstellations}
                  onChange={(event) => setShowConstellations(event.target.checked)}
                />
                <span>{dictionary.viewer.toggles.constellations}</span>
              </label>
              <label className="toggle-item">
                <input type="checkbox" checked={showGuides} onChange={(event) => setShowGuides(event.target.checked)} />
                <span>{dictionary.viewer.toggles.guides}</span>
              </label>
              <label className="toggle-item">
                <input type="checkbox" checked={showPlanets} onChange={(event) => setShowPlanets(event.target.checked)} />
                <span>{dictionary.viewer.toggles.planets}</span>
              </label>
              <label className="toggle-item">
                <input type="checkbox" checked={autoRotate} onChange={(event) => setAutoRotate(event.target.checked)} />
                <span>{dictionary.viewer.toggles.autoRotate}</span>
              </label>
            </div>
            <label className="stacked-field">
              <span>{dictionary.viewer.focusConstellation}</span>
              <select value={focusedConstellation} onChange={(event) => setFocusedConstellation(event.target.value)}>
                <option value="all">{dictionary.viewer.allSky}</option>
                {visibleConstellations.map((name) => (
                  <option key={name} value={name}>
                    {dictionary.constellations?.[name]?.[language] || name}
                  </option>
                ))}
              </select>
            </label>
            <button className="primary-button" type="button" onClick={requestLocation}>
              {dictionary.viewer.useLocation}
            </button>
          </section>

          {currentPage === "sketch" ? (
            <section>
              <p className="eyebrow">{dictionary.viewer.sketchLab}</p>
              <div className="toggle-grid">
                <button type="button" className={`focus-chip ${drawMode ? "is-active" : ""}`} onClick={() => setDrawMode((current) => !current)}>
                  {drawMode ? dictionary.viewer.finishSketching : dictionary.viewer.startSketching}
                </button>
                <button type="button" className="focus-chip" onClick={startNewSketch}>
                  {dictionary.viewer.newSketch}
                </button>
              </div>
              <label className="stacked-field">
                <span>{dictionary.viewer.sketchName}</span>
                <input
                  type="text"
                  value={sketchName}
                  placeholder={dictionary.viewer.sketchPlaceholder}
                  onChange={(event) => setSketchName(event.target.value)}
                  disabled={!drawMode}
                />
              </label>
              <dl className="summary-list compact">
                <div>
                  <dt>{dictionary.viewer.currentSketch}</dt>
                  <dd>{activeSketchName}</dd>
                </div>
                <div>
                  <dt>{dictionary.viewer.selectedStars}</dt>
                  <dd>{displayedSketchStarIds.length}</dd>
                </div>
              </dl>
              <div className="constellation-list">
                <button type="button" className="focus-chip" onClick={clearDraftSketch} disabled={!drawMode || draftSketchStarIds.length === 0}>
                  {dictionary.viewer.clearSketch}
                </button>
                <button type="button" className="focus-chip is-active" onClick={saveDraftSketch} disabled={!drawMode || draftSketchStarIds.length < 2}>
                  {dictionary.viewer.saveSketch}
                </button>
              </div>
              <p className="helper-copy">{dictionary.viewer.sketchHint}</p>
            </section>
          ) : null}

          <section>
            <p className="eyebrow">{dictionary.viewer.sceneStatus}</p>
            <dl className="summary-list">
              <div>
                <dt>{dictionary.viewer.status}</dt>
                <dd>{sceneState.status}</dd>
              </div>
              <div>
                <dt>{dictionary.viewer.catalog}</dt>
                <dd>{sceneState.data?.summary.catalog ?? "--"}</dd>
              </div>
              <div>
                <dt>{dictionary.viewer.visibleStars}</dt>
                <dd>{sceneState.data?.summary.visibleStars ?? "--"}</dd>
              </div>
              <div>
                <dt>{dictionary.viewer.visibleConstellations}</dt>
                <dd>{sceneState.data?.summary.visibleConstellations.length ?? "--"}</dd>
              </div>
            </dl>
            {sceneState.error ? <p className="error-copy">{sceneState.error}</p> : null}
          </section>
        </aside>

        <main ref={viewerRef} className={`viewer ${isFullscreen ? "is-fullscreen" : ""}`}>
          <PlanetariumCanvas
            scene={sceneState.data}
            planets={planets}
            selectedTarget={selectedTarget}
            onSelectTarget={selectTarget}
            language={language}
            dictionary={dictionary}
            showLabels={showLabels}
            showGuides={showGuides}
            showConstellations={showConstellations}
            showPlanets={showPlanets}
            autoRotate={autoRotate}
            focusedConstellation={currentPage === "watch" ? focusedConstellation : "all"}
            drawMode={currentPage === "sketch" ? drawMode : false}
            customSketchStarIds={displayedSketchStarIds}
          />
          <div className="viewer-overlay">
            <span>{dictionary.viewer.overlay.horizon}</span>
            <span>{dictionary.viewer.overlay.motion}</span>
            <span>{currentPage === "watch" ? dictionary.viewer.overlay.inspect : dictionary.viewer.overlay.draw}</span>
            <button type="button" className="overlay-button" onClick={toggleFullscreen}>
              {isFullscreen ? dictionary.viewer.exitFullscreen : dictionary.viewer.enterFullscreen}
            </button>
          </div>
        </main>

        <aside className="inspector-panel">
          <section>
            <p className="eyebrow">{selectedPlanet ? dictionary.viewer.planetInspector : dictionary.viewer.starInspector}</p>
            {selectedPlanet ? (
              <>
                <h2>{dictionary.planetNames[selectedPlanet.name]}</h2>
                <p className="constellation-copy">{selectedPlanet.feature[language]}</p>
                <dl className="summary-list compact">
                  <div>
                    <dt>{dictionary.viewer.planetType}</dt>
                    <dd>{dictionary.planetTypes[selectedPlanet.type]}</dd>
                  </div>
                  <div>
                    <dt>{dictionary.viewer.orbitBand}</dt>
                    <dd>{Math.round(selectedPlanet.orbit)}</dd>
                  </div>
                  <div>
                    <dt>{dictionary.viewer.moons}</dt>
                    <dd>{selectedPlanet.moons}</dd>
                  </div>
                </dl>
              </>
            ) : selectedStar ? (
              <>
                <h2>{selectedStar.name}</h2>
                <p className="constellation-copy">
                  {dictionary.constellations?.[selectedStar.constellation]?.[language] || selectedStar.constellation}
                </p>
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
              <p className="helper-copy">{dictionary.viewer.pickHint}</p>
            )}
          </section>

          <section>
            <p className="eyebrow">{dictionary.viewer.constellationsInFrame}</p>
            <div className="constellation-list">
              {(sceneState.data?.summary.visibleConstellations || []).map((name) => (
                <span key={name}>{dictionary.constellations?.[name]?.[language] || name}</span>
              ))}
            </div>
          </section>
          <section>
            {currentPage === "watch" ? (
              <>
                <p className="eyebrow">{dictionary.viewer.planetsBand}</p>
                <div className="planet-chip-list">
                  {planets.map((planet) => (
                    <button
                      key={planet.name}
                      type="button"
                      className="planet-chip"
                      onClick={() => selectTarget({ kind: "planet", id: planet.name })}
                    >
                      <span className="planet-dot" style={{ "--planet-color": planet.color }} />
                      <strong>{dictionary.planetNames[planet.name]}</strong>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="eyebrow">{dictionary.viewer.savedSketches}</p>
                <div className="saved-sketch-list">
                  {savedSketches.length === 0 ? (
                    <p className="helper-copy">{dictionary.viewer.noSavedSketches}</p>
                  ) : (
                    savedSketches.map((sketch) => (
                      <div key={sketch.id} className={`saved-sketch-card ${activeSketchId === sketch.id && !drawMode ? "is-active" : ""}`}>
                        <button type="button" className="saved-sketch-button" onClick={() => loadSketch(sketch.id)}>
                          <strong>{sketch.name}</strong>
                          <small>{sketch.starIds.length} stars</small>
                        </button>
                        <button type="button" className="focus-chip" onClick={() => removeSketch(sketch.id)}>
                          {dictionary.viewer.deleteSketch}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </section>
          {currentPage === "watch" ? (
            <section>
              <p className="eyebrow">{dictionary.viewer.quickFocus}</p>
              <div className="constellation-list">
                <button type="button" className={`focus-chip ${focusedConstellation === "all" ? "is-active" : ""}`} onClick={() => setFocusedConstellation("all")}>
                  {dictionary.viewer.allSky}
                </button>
                {visibleConstellations.map((name) => (
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
            </section>
          ) : (
            <section>
              <p className="eyebrow">{dictionary.viewer.sketchTips}</p>
              <div className="constellation-list">
                <span>{dictionary.viewer.sketchTipsList.pick}</span>
                <span>{dictionary.viewer.sketchTipsList.order}</span>
                <span>{dictionary.viewer.sketchTipsList.save}</span>
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
