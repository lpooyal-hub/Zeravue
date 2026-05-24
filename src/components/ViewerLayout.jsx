function ViewerHeader({
  dictionary,
  currentPage,
  setCurrentPage,
  language,
  setLanguage,
  observer,
  headerEyebrow,
  headerTitle,
  headerSubtitle,
  themes,
  currentThemeId,
  switchTheme,
  sketchEnabled = true,
  showThemeSwitcher = true,
  homeHref = "/"
}) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">{headerEyebrow || dictionary.viewer.eyebrow}</p>
        <h1>{headerTitle || dictionary.viewer.title}</h1>
        <p className="topbar-copy">{headerSubtitle || dictionary.viewer.subtitle}</p>
      </div>
      <div className="topbar-controls">
        <div className="page-switcher" aria-label={dictionary.viewer.pageMode}>
          <button type="button" aria-pressed={currentPage === "watch"} onClick={() => setCurrentPage("watch")}>
            {dictionary.viewer.pages.watch}
          </button>
          <button type="button" aria-pressed={currentPage === "sketch"} onClick={() => setCurrentPage("sketch")} disabled={!sketchEnabled}>
            {dictionary.viewer.pages.sketch}
          </button>
        </div>
        {showThemeSwitcher ? (
          <div className="theme-switcher" aria-label={dictionary.viewer.themeLabel}>
            {themes.map((theme) => (
              <button key={theme.id} type="button" aria-pressed={currentThemeId === theme.id} onClick={() => switchTheme(theme.id)}>
                {theme.displayName?.[language] || theme.name}
              </button>
            ))}
          </div>
        ) : null}
        <div className="language-switcher" aria-label="Language">
          <button type="button" aria-pressed={language === "en"} onClick={() => setLanguage("en")}>
            EN
          </button>
          <button type="button" aria-pressed={language === "ko"} onClick={() => setLanguage("ko")}>
            KR
          </button>
        </div>
        <a className="home-link-button" href={homeHref}>
          {language === "ko" ? "테마 홈" : "Themes"}
        </a>
        <div className="observer-pill">
          <span>{dictionary.viewer.observer}</span>
          <strong>{observer.label}</strong>
          <small>
            {observer.latitude.toFixed(2)}, {observer.longitude.toFixed(2)}
          </small>
        </div>
      </div>
    </header>
  );
}

export { ViewerHeader };
