import { useEffect, useRef, useState } from "react";

export function useAuroraExperience({
  auroraWatchLayout,
  autoEnterTargetRef,
  currentPage,
  language,
  markFullscreenEnter,
  markViewerEnter,
  analyticsSessionRef,
  currentThemeId,
  wakeAmbient,
  ensureAmbientOn,
  isFullscreen,
  setIsFullscreen,
  markFullscreenExit,
  setViewMode
}) {
  const [showAuroraMoodControls, setShowAuroraMoodControls] = useState(false);
  const [auroraViewerOpen, setAuroraViewerOpen] = useState(true);
  const [immersiveIntro, setImmersiveIntro] = useState(null);
  const auroraViewerRef = useRef(null);
  const auroraUiTimerRef = useRef(null);
  const [auroraUiVisible, setAuroraUiVisible] = useState(true);

  useEffect(() => {
    function handleFullscreenChange() {
      const next = Boolean(document.fullscreenElement);
      if (isFullscreen && !next) {
        markFullscreenExit(analyticsSessionRef.current);
      }
      setIsFullscreen(next);
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [analyticsSessionRef, isFullscreen, markFullscreenExit, setIsFullscreen]);

  useEffect(() => {
    if (!auroraViewerOpen) {
      return;
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setAuroraViewerOpen(false);
        setShowAuroraMoodControls(false);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [auroraViewerOpen]);

  function revealAuroraUi() {
    setAuroraUiVisible(true);
    if (auroraUiTimerRef.current) {
      clearTimeout(auroraUiTimerRef.current);
    }
    auroraUiTimerRef.current = setTimeout(() => {
      setAuroraUiVisible(false);
    }, 4200);
  }

  async function startAuroraViewer() {
    wakeAmbient();
    await ensureAmbientOn();
    setAuroraViewerOpen(true);
    setAuroraUiVisible(true);

    const target = auroraViewerRef.current;
    if (!target?.requestFullscreen) {
      return;
    }

    try {
      markFullscreenEnter(analyticsSessionRef.current);
      markViewerEnter(analyticsSessionRef.current, currentThemeId, window.location.pathname || "/");
      await target.requestFullscreen();
    } catch (error) {
      console.error("Aurora fullscreen request failed:", error);
    }
  }

  async function toggleAuroraFullscreen() {
    const target = auroraViewerRef.current;
    if (!target?.requestFullscreen) {
      return;
    }

    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch (error) {
        console.error("Aurora fullscreen exit failed:", error);
      }
      return;
    }

    wakeAmbient();
    await ensureAmbientOn();

    try {
      markFullscreenEnter(analyticsSessionRef.current);
      markViewerEnter(analyticsSessionRef.current, currentThemeId, window.location.pathname || "/");
      await target.requestFullscreen();
    } catch (error) {
      console.error("Aurora fullscreen request failed:", error);
    }
  }

  async function closeAuroraViewer() {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch (error) {
        console.error("Aurora fullscreen exit failed:", error);
      }
    }
    setAuroraViewerOpen(false);
    setShowAuroraMoodControls(false);
    setAuroraUiVisible(true);
    if (auroraUiTimerRef.current) {
      clearTimeout(auroraUiTimerRef.current);
      auroraUiTimerRef.current = null;
    }
  }

  useEffect(() => {
    const target = autoEnterTargetRef.current;
    if (!target) {
      return;
    }

    const intro =
      target === "/aurora"
        ? {
            title: language === "ko" ? "오로라" : "Aurora",
            subtitle: language === "ko" ? "조용히 흐르는 빛" : "quiet drifting lights"
          }
        : {
            title: language === "ko" ? "밤하늘" : "Night Sky",
            subtitle: language === "ko" ? "천천히 숨 고르는 밤" : "breathe and stay for a while"
          };

    setImmersiveIntro(intro);
    const clearIntroTimer = window.setTimeout(() => setImmersiveIntro(null), 2800);

    if (target === "/aurora" && auroraWatchLayout) {
      startAuroraViewer();
    }

    if (target === "/night-sky" && !auroraWatchLayout && currentPage === "watch") {
      setViewMode("space");
    }

    autoEnterTargetRef.current = null;
    return () => window.clearTimeout(clearIntroTimer);
  }, [auroraWatchLayout, currentPage, language, setViewMode]);

  useEffect(() => {
    if (!auroraViewerOpen) {
      return;
    }
    revealAuroraUi();
    return () => {
      if (auroraUiTimerRef.current) {
        clearTimeout(auroraUiTimerRef.current);
        auroraUiTimerRef.current = null;
      }
    };
  }, [auroraViewerOpen]);

  const shouldShowAuroraPageChrome = auroraWatchLayout;

  return {
    showAuroraMoodControls,
    setShowAuroraMoodControls,
    auroraViewerOpen,
    immersiveIntro,
    auroraViewerRef,
    auroraUiVisible,
    revealAuroraUi,
    startAuroraViewer,
    toggleAuroraFullscreen,
    closeAuroraViewer,
    shouldShowAuroraPageChrome
  };
}
