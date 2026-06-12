function HeaderActionGroup({
  language,
  onLanguageChange,
  showHome = false,
  homeHref = "/"
}) {
  return (
    <div className="scene-header-actions topbar-controls-row">
      <div className="language-switcher" aria-label="Language">
        <button type="button" aria-pressed={language === "en"} onClick={() => onLanguageChange("en")}>
          EN
        </button>
        <button type="button" aria-pressed={language === "ko"} onClick={() => onLanguageChange("ko")}>
          KR
        </button>
      </div>
      {showHome ? (
        <a className="home-link-button" href={homeHref} aria-label={language === "ko" ? "메인 홈으로 이동" : "Go to home"}>
          {language === "ko" ? "홈" : "Home"}
        </a>
      ) : null}
    </div>
  );
}

export { HeaderActionGroup };
