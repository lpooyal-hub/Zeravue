function HeaderActionGroup({
  language,
  onLanguageChange,
  className = "",
  showHome = false,
  showLanguage = true,
  homeHref = "/",
  homeLabel,
  homeFirst = false
}) {
  const homeNode = showHome ? (
    <a className="home-link-button" href={homeHref} aria-label={language === "ko" ? "메인 홈으로 이동" : "Go to home"}>
      {homeLabel || (language === "ko" ? "홈" : "Home")}
    </a>
  ) : null;

  const languageNode = showLanguage ? (
    <div className="language-switcher" aria-label="Language">
      <button type="button" aria-pressed={language === "en"} onClick={() => onLanguageChange("en")}>
        EN
      </button>
      <button type="button" aria-pressed={language === "ko"} onClick={() => onLanguageChange("ko")}>
        KR
      </button>
    </div>
  ) : null;

  return (
    <div className={`scene-header-actions topbar-controls-row ${className}`.trim()}>
      {homeFirst ? (
        <>
          {homeNode}
          {languageNode}
        </>
      ) : (
        <>
          {languageNode}
          {homeNode}
        </>
      )}
    </div>
  );
}

export { HeaderActionGroup };
