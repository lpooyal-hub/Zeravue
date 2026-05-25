import { useEffect, useState } from "react";

function AuroraLayer() {
  return (
    <div className="aurora-ribbons" aria-hidden="true">
      <div className="aurora-ribbon ribbon-a" />
      <div className="aurora-ribbon ribbon-b" />
      <div className="aurora-ribbon ribbon-c" />
      <div className="aurora-ribbon ribbon-d" />
      <div className="aurora-ribbon ribbon-e" />
    </div>
  );
}

export function AuroraPanoramaScene() {
  const enableMouseParallax = false;
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(media.matches);
    const updateVisibility = () => setPaused(document.hidden);

    updateMotion();
    updateVisibility();

    media.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      media.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  function handlePointerMove(event) {
    if (!enableMouseParallax) {
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    setPointer({
      x: Math.max(-1, Math.min(1, nx)),
      y: Math.max(-1, Math.min(1, ny))
    });
  }

  function resetPointer() {
    if (!enableMouseParallax) {
      return;
    }
    setPointer({ x: 0, y: 0 });
  }

  return (
    <div
      className={`aurora-scene ${reducedMotion ? "is-reduced-motion" : ""} ${paused ? "is-paused" : ""}`}
      aria-hidden="true"
      style={{ "--px": pointer.x, "--py": pointer.y }}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
    >
      <div className="aurora-parallax aurora-parallax-bg">
        <div className="aurora-bg" />
      </div>
      <div className="aurora-parallax aurora-parallax-stars">
        <div className="aurora-stars aurora-stars-a" />
        <div className="aurora-stars aurora-stars-b" />
      </div>
      <div className="aurora-parallax aurora-parallax-aurora">
        <AuroraLayer />
      </div>
      <div className="aurora-parallax aurora-parallax-fog">
        <div className="aurora-fog aurora-fog-a" />
        <div className="aurora-fog aurora-fog-b" />
      </div>
      <div className="aurora-vignette" />
    </div>
  );
}
