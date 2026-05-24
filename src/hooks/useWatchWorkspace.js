import { shiftObservedTimestamp } from "../utils/viewerState.js";

export function useWatchWorkspace({
  language,
  currentPage,
  isSketchWatch,
  viewMode,
  creativeTool,
  sceneData,
  setObservedAt,
  setObserver,
  setFavoriteConstellations,
  setSelectedTarget,
  setFocusedConstellation,
  removeCustomObject,
  setZoomLevel,
  setConstellationSearch,
  setTrackConstellation,
  setResetViewToken
}) {
  function updateObserver(key, value) {
    setObserver((current) => ({
      ...current,
      [key]: Number(value),
      label: language === "ko" ? "사용자 위치" : "Custom observer"
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
        label: language === "ko" ? "현재 위치" : "Live location"
      });
    });
  }

  function toggleFavoriteConstellation(name) {
    if (!name || name === "all") {
      return;
    }
    setFavoriteConstellations((current) => (current.includes(name) ? current.filter((item) => item !== name) : [name, ...current]));
  }

  function selectTarget(target) {
    if ((currentPage === "sketch" || isSketchWatch) && target?.kind?.startsWith("custom-")) {
      if (isSketchWatch) {
        setSelectedTarget(target);
        return;
      }
      if (creativeTool === "delete") {
        removeCustomObject(target);
        return;
      }
      setSelectedTarget(target);
      return;
    }

    if (currentPage === "watch" && viewMode === "space") {
      return;
    }

    setSelectedTarget(target);

    if (target?.kind === "star") {
      const star = sceneData?.stars.find((item) => item.id === target.id);
      if (star?.constellation) {
        setFocusedConstellation(star.constellation);
      }
    }
  }

  function shiftTime(hours) {
    setObservedAt((current) => shiftObservedTimestamp(current, hours));
  }

  function changeZoom(delta) {
    setZoomLevel((current) => Math.min(1, Math.max(0, Number((current + delta).toFixed(2)))));
  }

  function resetView() {
    setZoomLevel(0.52);
    setConstellationSearch("");
    setFocusedConstellation("all");
    setTrackConstellation(false);
    setSelectedTarget(null);
    setResetViewToken((current) => current + 1);
  }

  return {
    updateObserver,
    requestLocation,
    toggleFavoriteConstellation,
    selectTarget,
    shiftTime,
    changeZoom,
    resetView
  };
}
