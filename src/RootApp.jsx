import { useEffect, useMemo, useState } from "react";
import { App as NightSkyApp } from "./App.jsx";
import { AdminAnalyticsPage } from "./components/AdminAnalyticsPage.jsx";
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
  const [showAdSlot, setShowAdSlot] = useState(false);
  const adsenseClient = import.meta.env.VITE_ADSENSE_CLIENT || "";
  const adsenseHomeSlot = import.meta.env.VITE_ADSENSE_HOME_SLOT || "";
  const adsenseEnabled = Boolean(adsenseClient && adsenseHomeSlot);

  useEffect(() => {
    if (!adsenseEnabled) {
      return undefined;
    }
    const timer = window.setTimeout(() => {
      setShowAdSlot(true);
    }, 10000);
    return () => window.clearTimeout(timer);
  }, [adsenseEnabled]);

  useEffect(() => {
    if (!showAdSlot || !adsenseEnabled) {
      return;
    }
    const scriptId = "zeravue-adsense-script";
    const hasScript = Boolean(document.getElementById(scriptId));
    if (!hasScript) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`;
      script.crossOrigin = "anonymous";
      document.head.appendChild(script);
    }
    window.setTimeout(() => {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (error) {
        console.warn("AdSense slot init skipped:", error);
      }
    }, 0);
  }, [adsenseClient, adsenseEnabled, showAdSlot]);

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
      {adsenseEnabled && showAdSlot ? (
        <section className="theme-home-ad" aria-label={language === "ko" ? "광고" : "Advertisement"}>
          <ins
            className="adsbygoogle zeravue-home-adsense"
            style={{ display: "block" }}
            data-ad-client={adsenseClient}
            data-ad-slot={adsenseHomeSlot}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </section>
      ) : null}
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

    if (path === "/admin") {
      return <AdminAnalyticsPage language={language} onBackHome={() => window.location.assign("/")} />;
    }

    return <HomePage language={language} setLanguage={setLanguage} />;
  }, [language, path]);

  return content;
}
