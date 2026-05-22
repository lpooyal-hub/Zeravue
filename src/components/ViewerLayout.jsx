function ViewerHeader({ dictionary, currentPage, setCurrentPage, language, setLanguage, observer }) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">{dictionary.viewer.eyebrow}</p>
        <h1>{dictionary.viewer.title}</h1>
        <p className="topbar-copy">{dictionary.viewer.subtitle}</p>
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
  );
}

export { ViewerHeader };
