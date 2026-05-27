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
      <footer className="theme-home-footer">
        <a href="/privacy">{language === "ko" ? "개인정보 처리방침" : "Privacy Policy"}</a>
        <a href="/cookies">{language === "ko" ? "쿠키 및 광고 안내" : "Cookie & Ads Notice"}</a>
      </footer>
    </div>
  );
}

const legalCopy = {
  privacy: {
    en: {
      title: "Privacy Policy",
      updated: "Last updated: May 27, 2026",
      intro:
        "Zeravue is a quiet web viewing service for night-sky and aurora scenes. We keep data collection limited to what is needed to run the service, protect basic operations, and support optional advertising.",
      sections: [
        {
          heading: "Information we process",
          body:
            "The app may process browser-provided technical data such as page path, device type, language preference, and approximate usage events. When location features are used, location data is requested by the browser and used to render sky guidance for the current session."
        },
        {
          heading: "Advertising and consent",
          body:
            "Zeravue may show Google AdSense ads on the home page. For users in the EEA, the United Kingdom, and Switzerland, Google CMP consent choices may be shown before advertising cookies or personalized ads are used."
        },
        {
          heading: "Storage",
          body:
            "Zeravue stores interface preferences such as language and viewer state in the browser. Server-side analytics, when enabled, are used only to understand service health and aggregate usage."
        },
        {
          heading: "Contact",
          body:
            "For privacy requests or corrections, contact cromege@gmail.com."
        }
      ]
    },
    ko: {
      title: "개인정보 처리방침",
      updated: "최종 업데이트: 2026년 5월 27일",
      intro:
        "Zeravue는 밤하늘과 오로라 장면을 조용히 감상하는 웹 서비스입니다. 서비스 운영, 기본 보호, 선택적 광고 제공에 필요한 범위로 데이터 처리를 제한합니다.",
      sections: [
        {
          heading: "처리하는 정보",
          body:
            "앱은 페이지 경로, 기기 유형, 언어 설정, 대략적인 사용 이벤트 같은 브라우저 기반 기술 정보를 처리할 수 있습니다. 위치 기능을 사용할 때는 브라우저 권한을 통해 위치 정보를 요청하며, 현재 세션의 하늘 안내를 렌더링하는 데 사용합니다."
        },
        {
          heading: "광고와 동의",
          body:
            "Zeravue는 홈 화면에 Google AdSense 광고를 표시할 수 있습니다. EEA, 영국, 스위스 사용자의 경우 광고 쿠키 또는 개인 맞춤 광고 사용 전에 Google CMP 동의 선택지가 표시될 수 있습니다."
        },
        {
          heading: "저장 방식",
          body:
            "Zeravue는 언어와 뷰어 상태 같은 화면 설정을 브라우저에 저장합니다. 서버 측 분석이 활성화된 경우 서비스 상태와 집계 사용량을 이해하는 용도로만 사용합니다."
        },
        {
          heading: "문의",
          body:
            "개인정보 관련 요청이나 정정 문의는 cromege@gmail.com 으로 보내 주세요."
        }
      ]
    }
  },
  cookies: {
    en: {
      title: "Cookie & Ads Notice",
      updated: "Last updated: May 27, 2026",
      intro:
        "This notice explains how Zeravue uses browser storage, cookies, and advertising technology.",
      sections: [
        {
          heading: "Essential storage",
          body:
            "Zeravue uses local browser storage for preferences such as language, scene selection, and viewer settings so the experience remains calm between visits."
        },
        {
          heading: "Google advertising",
          body:
            "When AdSense is enabled, Google and its partners may use cookies or similar technologies to serve and measure ads. Ads are delayed on the home page so the main viewing experience loads first."
        },
        {
          heading: "Consent choices",
          body:
            "Where required, Google CMP may provide consent, reject, and manage-options controls. You can change choices through Google's consent interface when it is available for your region."
        },
        {
          heading: "Browser controls",
          body:
            "You can also block or delete cookies through your browser settings. Some optional features may become less personalized when storage is disabled."
        }
      ]
    },
    ko: {
      title: "쿠키 및 광고 안내",
      updated: "최종 업데이트: 2026년 5월 27일",
      intro:
        "이 안내는 Zeravue가 브라우저 저장소, 쿠키, 광고 기술을 어떻게 사용하는지 설명합니다.",
      sections: [
        {
          heading: "필수 저장소",
          body:
            "Zeravue는 언어, 장면 선택, 뷰어 설정 같은 선호값을 브라우저 로컬 저장소에 저장해 방문 사이에도 차분한 사용 경험을 유지합니다."
        },
        {
          heading: "Google 광고",
          body:
            "AdSense가 활성화된 경우 Google 및 파트너는 광고 제공과 측정을 위해 쿠키 또는 유사 기술을 사용할 수 있습니다. 광고는 홈 화면에서 지연 로드되어 기본 감상 경험이 먼저 표시됩니다."
        },
        {
          heading: "동의 선택",
          body:
            "필요한 지역에서는 Google CMP가 동의, 동의하지 않음, 옵션 관리 선택지를 제공할 수 있습니다. 해당 지역에서 인터페이스가 제공되면 Google 동의 화면을 통해 선택을 변경할 수 있습니다."
        },
        {
          heading: "브라우저 제어",
          body:
            "브라우저 설정에서 쿠키를 차단하거나 삭제할 수도 있습니다. 저장소를 비활성화하면 일부 선택 기능의 개인화가 줄어들 수 있습니다."
        }
      ]
    }
  }
};

function LegalPage({ type, language, setLanguage }) {
  const copy = legalCopy[type][language] || legalCopy[type].en;

  return (
    <main className="legal-page">
      <div className="legal-page-topbar">
        <a className="home-link-button" href="/">
          {language === "ko" ? "홈으로" : "Home"}
        </a>
        <div className="language-switcher" aria-label="Language">
          <button type="button" aria-pressed={language === "en"} onClick={() => setLanguage("en")}>
            EN
          </button>
          <button type="button" aria-pressed={language === "ko"} onClick={() => setLanguage("ko")}>
            KR
          </button>
        </div>
      </div>
      <header className="legal-page-header">
        <p className="eyebrow">Zeravue</p>
        <h1>{copy.title}</h1>
        <p>{copy.intro}</p>
        <small>{copy.updated}</small>
      </header>
      <div className="legal-page-sections">
        {copy.sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            <p>{section.body}</p>
          </section>
        ))}
      </div>
    </main>
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

    if (path === "/privacy") {
      return <LegalPage type="privacy" language={language} setLanguage={setLanguage} />;
    }

    if (path === "/cookies") {
      return <LegalPage type="cookies" language={language} setLanguage={setLanguage} />;
    }

    return <HomePage language={language} setLanguage={setLanguage} />;
  }, [language, path]);

  return content;
}
