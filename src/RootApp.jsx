import { useEffect, useMemo, useState } from "react";
import { App as NightSkyApp } from "./App.jsx";
import { AdminAnalyticsPage } from "./components/AdminAnalyticsPage.jsx";
import { useTheme } from "./context/ThemeContext.jsx";
import { getInitialLanguage, translations } from "./data/i18n.js";

const buildLogs = [
  {
    slug: "2026-05-29",
    date: "2026-05-29",
    title: {
      en: "Watch UI density cleanup and stability improvements",
      ko: "Watch UI 밀도 정리와 안정화 개선"
    },
    summary: {
      en: "Moved key controls closer to the canvas, merged long left-panel blocks into a bottom dock, and stabilized observer time feedback.",
      ko: "핵심 조작을 캔버스 근처로 옮기고 좌측 긴 카드들을 하단 도킹으로 통합했으며, 관측자 시간 피드백을 안정화했습니다."
    }
  }
];

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
      <section className="theme-home-updates">
        <div className="theme-home-updates-header">
          <p className="eyebrow">{language === "ko" ? "업데이트" : "Updates"}</p>
          <a href="/updates">{language === "ko" ? "전체 보기" : "View all"}</a>
        </div>
        <div className="theme-home-updates-list">
          {buildLogs.slice(0, 3).map((item) => (
            <a key={item.slug} className="theme-home-update-card" href={`/updates/${item.slug}`}>
              <strong>{item.title[language] || item.title.en}</strong>
              <small>{item.summary[language] || item.summary.en}</small>
              <span>{item.date}</span>
            </a>
          ))}
        </div>
      </section>
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
        <a href="/about">{language === "ko" ? "소개" : "About"}</a>
        <a href="/privacy">{language === "ko" ? "개인정보 처리방침" : "Privacy Policy"}</a>
        <a href="/cookies">{language === "ko" ? "쿠키 및 광고 안내" : "Cookie & Ads Notice"}</a>
      </footer>
    </div>
  );
}

const aboutCopy = {
  en: {
    title: "About Zeravue",
    updated: "Updated: May 27, 2026",
    intro:
      "Zeravue is a calm digital night-sky and aurora viewing platform with an interactive constellation viewer, observer-time controls, and healing-focused visual pacing.",
    sections: [
      {
        heading: "What we build",
        body:
          "Zeravue provides theme-based immersive pages such as Night Sky and Aurora. Each theme combines ambient motion, constellation visibility, and observer context to help users pause, observe, and stay present."
      },
      {
        heading: "How it works",
        body:
          "The viewer uses local rendering and lightweight state to keep interaction responsive. Star visibility, labels, and observer-time adjustments are tuned for readability first, while optional analytics and ad settings remain separate from core controls."
      },
      {
        heading: "Updates and transparency",
        body:
          "We publish build updates to track UI and experience changes over time. This helps visitors and partners understand what changed, why it changed, and how Zeravue is evolving."
      },
      {
        heading: "Trust and contact",
        body:
          "We keep legal and ad notices public so visitors can understand privacy and cookie handling. For questions, partnerships, or corrections, contact cromege@gmail.com."
      }
    ]
  },
  ko: {
    title: "Zeravue 소개",
    updated: "업데이트: 2026년 5월 27일",
    intro:
      "Zeravue는 밤하늘/오로라를 차분하게 감상하는 디지털 뷰잉 플랫폼입니다. 별자리 관측, 관측 시각 조정, 몰입형 분위기 연출을 안정적으로 제공합니다.",
    sections: [
      {
        heading: "우리가 만드는 것",
        body:
          "Zeravue는 Night Sky, Aurora 같은 테마 기반 몰입 페이지를 제공합니다. 각 테마는 별자리 가독성과 감상 리듬을 함께 고려해 잠시 멈추고 머물 수 있도록 설계됩니다."
      },
      {
        heading: "동작 방식",
        body:
          "뷰어는 로컬 렌더링과 가벼운 상태 관리를 사용해 반응성을 유지합니다. 별 표시, 라벨, 관측 시각 제어는 가독성을 기준으로 조정되며 선택적 분석/광고 설정은 핵심 감상 제어와 분리해 운영합니다."
      },
      {
        heading: "업데이트 공개",
        body:
          "UI/경험 변경 사항은 업데이트 로그로 공개해 어떤 변화가 있었는지 명확하게 확인할 수 있도록 합니다."
      },
      {
        heading: "신뢰와 문의",
        body:
          "방문자가 개인정보와 쿠키 처리 방식을 이해할 수 있도록 관련 안내를 공개합니다. 문의, 제휴, 정정 요청은 cromege@gmail.com 으로 보내 주세요."
      }
    ]
  }
};

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

function UpdatesPage({ language, setLanguage }) {
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
        <h1>{language === "ko" ? "업데이트 로그" : "Build Updates"}</h1>
        <p>{language === "ko" ? "최근 작업과 UI 개선 내역을 기록합니다." : "Recent product and UI updates."}</p>
      </header>
      <div className="legal-page-sections updates-list-page">
        {buildLogs.map((item) => (
          <section key={item.slug}>
            <h2>
              <a href={`/updates/${item.slug}`}>{item.title[language] || item.title.en}</a>
            </h2>
            <p>{item.summary[language] || item.summary.en}</p>
            <small>{item.date}</small>
          </section>
        ))}
      </div>
    </main>
  );
}

function UpdateDetailPage({ language, setLanguage, slug }) {
  const item = buildLogs.find((log) => log.slug === slug);
  if (!item) {
    return <UpdatesPage language={language} setLanguage={setLanguage} />;
  }
  return (
    <main className="legal-page">
      <div className="legal-page-topbar">
        <a className="home-link-button" href="/updates">
          {language === "ko" ? "업데이트 목록" : "Back to updates"}
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
        <p className="eyebrow">Zeravue Build Log</p>
        <h1>{item.title[language] || item.title.en}</h1>
        <p>{item.summary[language] || item.summary.en}</p>
        <small>{item.date}</small>
      </header>
    </main>
  );
}

function AboutPage({ language, setLanguage }) {
  const copy = aboutCopy[language] || aboutCopy.en;

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
    const seoByPath = {
      "/": {
        title: "Zeravue · Quiet Digital Experiences",
        description: "Ambient digital themes for calm, immersive night-sky and aurora viewing."
      },
      "/home": {
        title: "Zeravue · Quiet Digital Experiences",
        description: "Ambient digital themes for calm, immersive night-sky and aurora viewing."
      },
      "/night-sky": {
        title: "Night Sky Viewer · Zeravue",
        description: "Explore constellations, observer time, and a calm night-sky viewer on Zeravue."
      },
      "/aurora": {
        title: "Aurora Night · Zeravue",
        description: "Enter Zeravue Aurora Night for a gentle, immersive aurora viewing experience."
      },
      "/about": {
        title: "About Zeravue",
        description: "Learn about Zeravue, our calm viewing goals, and how to contact us."
      },
      "/updates": {
        title: "Build Updates · Zeravue",
        description: "Read recent Zeravue build updates and product/UI improvements."
      },
      "/privacy": {
        title: "Privacy Policy · Zeravue",
        description: "Read how Zeravue handles privacy, data processing, and ad-related choices."
      },
      "/cookies": {
        title: "Cookie & Ads Notice · Zeravue",
        description: "Understand Zeravue cookie usage, browser storage, and AdSense notice details."
      }
    };
    const defaults = seoByPath["/"];
    const resolved = path.startsWith("/updates/") ? seoByPath["/updates"] : seoByPath[path] || defaults;
    const baseUrl = window.location.origin || "https://zeravue.xyz";

    document.title = resolved.title;

    const descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta) {
      descriptionMeta.setAttribute("content", resolved.description);
    }

    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("href", `${baseUrl}${path === "/home" ? "/" : path}`);
  }, [path]);

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

    if (path === "/about") {
      return <AboutPage language={language} setLanguage={setLanguage} />;
    }

    if (path === "/updates") {
      return <UpdatesPage language={language} setLanguage={setLanguage} />;
    }

    if (path.startsWith("/updates/")) {
      const slug = path.replace("/updates/", "");
      return <UpdateDetailPage language={language} setLanguage={setLanguage} slug={slug} />;
    }

    return <HomePage language={language} setLanguage={setLanguage} />;
  }, [language, path]);

  return content;
}
