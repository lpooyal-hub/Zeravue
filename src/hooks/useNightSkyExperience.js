import { useEffect, useMemo, useRef, useState } from "react";

export function useNightSkyExperience({
  observedAt,
  language,
  currentPage,
  auroraWatchLayout,
  viewMode,
  resetView,
  changeZoom,
  isFullscreen,
  setControlsHiddenInFullscreen,
  viewerRef,
  markViewerEnter,
  markFullscreenEnter,
  analyticsSessionRef,
  currentThemeId,
  markThemeSwitch,
  switchTheme
}) {
  const [timeShiftCue, setTimeShiftCue] = useState(null);
  const timeShiftCueTimerRef = useRef(null);
  const previousObservedAtRef = useRef(observedAt);
  const viewerUiTimerRef = useRef(null);
  const [viewerUiVisible, setViewerUiVisible] = useState(true);

  useEffect(() => {
    const previousValue = previousObservedAtRef.current;
    if (previousValue === observedAt) {
      return;
    }

    previousObservedAtRef.current = observedAt;
    const previousDate = new Date(previousValue);
    const currentDate = new Date(observedAt);
    if (Number.isNaN(previousDate.getTime()) || Number.isNaN(currentDate.getTime())) {
      return;
    }

    const deltaMs = currentDate.getTime() - previousDate.getTime();
    if (Math.abs(deltaMs) < 60 * 1000) {
      return;
    }

    const deltaHours = Math.round((deltaMs / (60 * 60 * 1000)) * 10) / 10;
    setTimeShiftCue({ deltaHours });
    if (timeShiftCueTimerRef.current) {
      clearTimeout(timeShiftCueTimerRef.current);
    }
    timeShiftCueTimerRef.current = setTimeout(() => {
      setTimeShiftCue(null);
    }, 1600);
  }, [observedAt]);

  useEffect(() => {
    return () => {
      if (timeShiftCueTimerRef.current) {
        clearTimeout(timeShiftCueTimerRef.current);
      }
    };
  }, []);

  const observerMomentLabel = useMemo(() => {
    const date = new Date(observedAt);
    if (Number.isNaN(date.getTime())) {
      return observedAt;
    }
    return new Intl.DateTimeFormat(language === "ko" ? "ko-KR" : "en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }).format(date);
  }, [language, observedAt]);

  const timeShiftOverlayLabel = useMemo(() => {
    if (!timeShiftCue) {
      return "";
    }
    const deltaHours = timeShiftCue.deltaHours;
    if (deltaHours > 0) {
      return language === "ko" ? `+${deltaHours}시간 이동` : `+${deltaHours}h jump`;
    }
    return language === "ko" ? `${deltaHours}시간 이동` : `${deltaHours}h jump`;
  }, [language, timeShiftCue]);

  function revealViewerUi() {
    setViewerUiVisible(true);
    if (viewerUiTimerRef.current) {
      clearTimeout(viewerUiTimerRef.current);
    }
    viewerUiTimerRef.current = setTimeout(() => {
      setViewerUiVisible(false);
    }, 2800);
  }

  useEffect(() => {
    function handleKeydown(event) {
      if (currentPage === "watch" && !auroraWatchLayout) {
        revealViewerUi();
      }
      const target = event.target;
      const tagName = target?.tagName?.toLowerCase();
      const isTypingField = tagName === "input" || tagName === "textarea" || tagName === "select" || target?.isContentEditable;
      if (isTypingField) {
        return;
      }

      if (event.key.toLowerCase() === "r") {
        event.preventDefault();
        resetView();
        return;
      }

      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        changeZoom(0.1);
        return;
      }

      if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        changeZoom(-0.1);
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [auroraWatchLayout, changeZoom, currentPage, resetView, viewMode]);

  useEffect(() => {
    if (auroraWatchLayout || currentPage !== "watch") {
      setViewerUiVisible(true);
      if (viewerUiTimerRef.current) {
        clearTimeout(viewerUiTimerRef.current);
        viewerUiTimerRef.current = null;
      }
      return;
    }
    revealViewerUi();
    return () => {
      if (viewerUiTimerRef.current) {
        clearTimeout(viewerUiTimerRef.current);
        viewerUiTimerRef.current = null;
      }
    };
  }, [auroraWatchLayout, currentPage, viewMode]);

  useEffect(() => {
    if (!isFullscreen) {
      setControlsHiddenInFullscreen(false);
    }
  }, [isFullscreen, setControlsHiddenInFullscreen]);

  async function toggleFullscreen() {
    if (!viewerRef.current) {
      return;
    }

    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    markViewerEnter(analyticsSessionRef.current, currentThemeId, window.location.pathname || "/");
    markFullscreenEnter(analyticsSessionRef.current);
    await viewerRef.current.requestFullscreen();
  }

  function handleThemeSwitch(nextThemeId) {
    markThemeSwitch(analyticsSessionRef.current, nextThemeId, window.location.pathname || "/");
    switchTheme(nextThemeId);
  }

  return {
    timeShiftCue,
    observerMomentLabel,
    timeShiftOverlayLabel,
    viewerUiVisible,
    revealViewerUi,
    toggleFullscreen,
    handleThemeSwitch
  };
}
