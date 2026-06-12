import { useMemo, useState } from "react";
import { HeaderActionGroup } from "./HeaderActionGroup.jsx";

function ViewerHeader({
  className = "",
  dictionary,
  currentPage,
  setCurrentPage,
  language,
  setLanguage,
  observer,
  observedAt,
  headerEyebrow,
  headerTitle,
  headerSubtitle,
  themes,
  currentThemeId,
  switchTheme,
  sketchEnabled = true,
  showPageSwitcher = true,
  showThemeSwitcher = true,
  showHeaderLogo = true,
  homeHref = "/"
}) {
  const [headerLogoSrc, setHeaderLogoSrc] = useState("/branding/zeravue-logo.svg");
  const localTimeLabel = useMemo(() => {
    const value = new Date(observedAt);
    if (Number.isNaN(value.getTime())) {
      return "--:--";
    }
    return new Intl.DateTimeFormat(language === "ko" ? "ko-KR" : "en-US", {
      hour: "numeric",
      minute: "2-digit"
    }).format(value);
  }, [language, observedAt]);

  return (
    <header className={`topbar ${className}`.trim()}>
      <div className="topbar-brand">
        {showHeaderLogo ? (
          <a className="topbar-logo-link" href={homeHref} aria-label={language === "ko" ? "메인 홈으로 이동" : "Go to home"}>
            <img
              className="topbar-logo"
              src={headerLogoSrc}
              alt="Zeravue logo"
              loading="eager"
              onError={() => {
                if (headerLogoSrc.endsWith(".svg")) {
                  setHeaderLogoSrc("/branding/zeravue-logo.png");
                  return;
                }
              }}
            />
          </a>
        ) : null}
        <p className="eyebrow">{headerEyebrow || dictionary.viewer.eyebrow}</p>
        <h1>{headerTitle || dictionary.viewer.title}</h1>
        <p className="topbar-copy">{headerSubtitle || dictionary.viewer.subtitle}</p>
      </div>
      <div className="topbar-controls">
        <HeaderActionGroup language={language} onLanguageChange={setLanguage} showHome={!showHeaderLogo} homeHref={homeHref} />
        <div className="observer-pill observer-pill--quiet">
          <span>{language === "ko" ? "현재 위치" : "Current location"}</span>
          <strong>{observer.label} · {language === "ko" ? "KR" : "KR"}</strong>
          <small>{language === "ko" ? "현재 시각" : "Local time"} · {localTimeLabel}</small>
        </div>
        {showPageSwitcher ? (
          <div className="topbar-controls-row topbar-page-row">
            <div className="page-switcher" aria-label={dictionary.viewer.pageMode}>
              <button type="button" aria-pressed={currentPage === "watch"} onClick={() => setCurrentPage("watch")}>
                {dictionary.viewer.pages.watch}
              </button>
              <button type="button" aria-pressed={currentPage === "sketch"} onClick={() => setCurrentPage("sketch")} disabled={!sketchEnabled}>
                {dictionary.viewer.pages.sketch}
              </button>
            </div>
          </div>
        ) : null}
        {showThemeSwitcher ? (
          <div className="theme-switcher topbar-controls-row topbar-theme-row" aria-label={dictionary.viewer.themeLabel}>
            {themes.map((theme) => (
              <button key={theme.id} type="button" aria-pressed={currentThemeId === theme.id} onClick={() => switchTheme(theme.id)}>
                {theme.displayName?.[language] || theme.name}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </header>
  );
}

export { ViewerHeader };
