import { useMemo, useState } from "react";

function ViewerHeader({
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
  showThemeSwitcher = true,
  homeHref = "/"
}) {
  const [showProfileImage, setShowProfileImage] = useState(true);
  const [profileImageSrc, setProfileImageSrc] = useState("/branding/zeravue-mark.svg");
  const [showHeaderLogo, setShowHeaderLogo] = useState(true);
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
    <header className="topbar">
      <div className="topbar-brand">
        {showHeaderLogo ? (
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
              setShowHeaderLogo(false);
            }}
          />
        ) : null}
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
          {showProfileImage ? (
            <img
              className="observer-avatar"
              src={profileImageSrc}
              alt="Zeravue profile"
              loading="lazy"
              onError={() => {
                if (profileImageSrc.endsWith(".svg")) {
                  setProfileImageSrc("/branding/zeravue-profile.png");
                  return;
                }
                setShowProfileImage(false);
              }}
            />
          ) : null}
          <span>{language === "ko" ? "오늘 밤 하늘" : "Tonight Sky"}</span>
          <strong>{observer.label} · {language === "ko" ? "KR" : "KR"}</strong>
          <small>{language === "ko" ? "현재 시각" : "Local Time"} · {localTimeLabel}</small>
        </div>
      </div>
    </header>
  );
}

export { ViewerHeader };
