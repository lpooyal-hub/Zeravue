import { useEffect, useMemo, useState } from "react";
import { App as NightSkyApp } from "./App.jsx";
import { useTheme } from "./context/ThemeContext.jsx";
import { getInitialLanguage, translations } from "./data/i18n.js";

function normalizePath(pathname) {
  if (!pathname || pathname === "/") {
    return "/";
  }
  return pathname.replace(/\/+$/, "") || "/";
}

function HomePage({ language, setLanguage }) {
  const dictionary = translations[language];
  const [showBrandLogo, setShowBrandLogo] = useState(true);
  const [brandLogoSrc, setBrandLogoSrc] = useState("/branding/zeravue-logo.svg");
  const [isTransitioning, setIsTransitioning] = useState(false);

  const enterTheme = (event, href) => {
    event.preventDefault();
    if (isTransitioning) {
      return;
    }

    try {
      window.sessionStorage.setItem("zeravue:auto-enter-target", href);
      window.sessionStorage.setItem("zeravue:auto-enter-at", String(Date.now()));
    } catch (error) {
      console.warn("Failed to persist auto-enter flag:", error);
    }

    setIsTransitioning(true);
    window.setTimeout(() => {
      window.location.assign(href);
    }, 420);
  };

  return (
    <div className={`theme-home ${isTransitioning ? "is-transitioning" : ""}`}>
      <header className="theme-home-header">
        <div className="language-switcher" aria-label="Language">
          <button type="button" aria-pressed={language === "en"} onClick={() => setLanguage("en")}>
            EN
          </button>
          <button type="button" aria-pressed={language === "ko"} onClick={() => setLanguage("ko")}>
            KR
          </button>
        </div>
        {showBrandLogo ? (
          <img
            className="theme-home-brand-logo"
            src={brandLogoSrc}
            alt="Zeravue logo"
            loading="eager"
            onError={() => {
              if (brandLogoSrc.endsWith(".svg")) {
                setBrandLogoSrc("/branding/zeravue-logo.png");
                return;
              }
              setShowBrandLogo(false);
            }}
          />
        ) : null}
        <p className="eyebrow">Zeravue</p>
        <h1>{language === "ko" ? "지금 머물고 싶은 장면을 고르세요." : "Choose the scene you want to rest in."}</h1>
        <p>{language === "ko" ? "메인에서 테마를 고르고, 각 테마 페이지에서 조용히 감상하세요." : "Pick a theme from home, then settle into a dedicated viewing page."}</p>
      </header>

      <div className="theme-home-grid">
        <a className="theme-home-card" href="/night-sky" onClick={(event) => enterTheme(event, "/night-sky")}>
          <strong>{dictionary.viewer.pages.watch}</strong>
          <small>{language === "ko" ? "별자리와 밤하늘을 감상합니다." : "Observe stars and constellations in a quiet sky."}</small>
        </a>
        <a className="theme-home-card" href="/aurora" onClick={(event) => enterTheme(event, "/aurora")}>
          <strong>{language === "ko" ? "오로라 감상" : "Aurora Night"}</strong>
          <small>{language === "ko" ? "부드러운 오로라 분위기를 감상합니다." : "Enjoy a gentle aurora-focused atmosphere."}</small>
        </a>
      </div>
    </div>
  );
}

export function RootApp() {
  const { switchTheme } = useTheme();
  const [language, setLanguage] = useState(getInitialLanguage);
  const [path, setPath] = useState(() => normalizePath(window.location.pathname));

  useEffect(() => {
    function onLocationChange() {
      setPath(normalizePath(window.location.pathname));
    }
    window.addEventListener("popstate", onLocationChange);
    return () => window.removeEventListener("popstate", onLocationChange);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem("planetarium-language", language);
  }, [language]);

  useEffect(() => {
    if (path === "/aurora") {
      switchTheme("aurora-night");
      return;
    }
    if (path === "/aurora-live") {
      switchTheme("aurora-night");
      return;
    }
    if (path === "/night-sky") {
      switchTheme("night-sky");
    }
  }, [path, switchTheme]);

  const content = useMemo(() => {
    if (path === "/" || path === "/home") {
      return <HomePage language={language} setLanguage={setLanguage} />;
    }

    if (path === "/aurora") {
      return <NightSkyApp forcedLanguage={language} setForcedLanguage={setLanguage} showThemeSwitcher={false} auroraRenderer="css" />;
    }

    if (path === "/aurora-live") {
      return <NightSkyApp forcedLanguage={language} setForcedLanguage={setLanguage} showThemeSwitcher={false} auroraRenderer="webgl" />;
    }

    if (path === "/night-sky") {
      return <NightSkyApp forcedLanguage={language} setForcedLanguage={setLanguage} showThemeSwitcher={false} />;
    }

    return <HomePage language={language} setLanguage={setLanguage} />;
  }, [language, path]);

  return content;
}
