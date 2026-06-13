import { useEffect, useMemo, useState } from "react";
import { App as NightSkyApp } from "./App.jsx";
import { AdminAnalyticsPage } from "./components/AdminAnalyticsPage.jsx";
import { useTheme } from "./context/ThemeContext.jsx";
import { getInitialLanguage, translations } from "./data/i18n.js";
import { platformAboutCopy, platformHomeCopy, platformThemeCards } from "./data/platformContent.js";
import { getThemeRouteConfig } from "./data/themes/index.js";

const buildLogs = [
  {
    slug: "2026-06-12",
    date: "2026-06-12",
    title: {
      en: "Night Sky density cleanup and shared control rhythm",
      ko: "Night Sky 밀도 정리와 공통 조작 리듬 정돈"
    },
    summary: {
      en:
        "Softened the Night Sky header and side panels, tightened inspector and update-card hierarchy, and aligned immersive control sizing across themes so Zeravue feels more consistent.",
      ko:
        "Night Sky 상단과 좌우 패널 밀도를 더 차분하게 정리하고, inspector와 업데이트 카드 위계를 다시 맞췄으며, 몰입형 테마 하단 컨트롤 크기도 통일해 Zeravue 전체 감각을 더 일관되게 다듬었습니다."
    },
    areas: {
      en: ["Night Sky polish", "Home refinement", "Shared controls"],
      ko: ["Night Sky 마감", "메인 정리", "공통 컨트롤 정리"]
    },
    highlights: {
      en: [
        "Reduced visual weight in the Night Sky header, observer card, control panel, and inspector so the scene feels calmer without losing functionality.",
        "Reworked home hero spacing, update-card hierarchy, and theme-card hover behavior to make the front page read more quietly.",
        "Matched bottom control sizing across Aurora and Monsoon so immersive themes share a steadier interaction rhythm."
      ],
      ko: [
        "Night Sky 헤더, 현재 위치 카드, 좌측 control panel, 우측 inspector 무게를 조금씩 덜어내 기능은 유지하면서도 화면이 더 조용하게 읽히도록 정리했습니다.",
        "메인 히어로 간격, 업데이트 카드 위계, 테마 카드 hover 강도를 다시 맞춰 첫 화면이 더 차분하게 읽히도록 다듬었습니다.",
        "오로라와 깊은 숲의 비 하단 컨트롤 높이와 패딩을 맞춰, 몰입형 테마 사이 조작 리듬이 더 일정하게 느껴지도록 정리했습니다."
      ]
    },
    next: {
      en: [
        "Finish the final alignment pass between the Night Sky header and main canvas start line.",
        "Bring the fullscreen sketch tool panel down to the same density standard as the rest of Night Sky.",
        "Keep softening shared hover and focus feedback so the platform feels responsive without becoming flashy."
      ],
      ko: [
        "Night Sky 헤더와 메인 캔버스 시작선 사이 마지막 정렬 미세 조정을 마무리합니다.",
        "스케치 전체화면 도구 패널도 지금 Night Sky 밀도 기준에 맞춰 다시 정리합니다.",
        "hover와 focus 반응을 더 차분하게 다듬어, 반응성은 남기되 화면이 과하게 튀지 않게 계속 정리합니다."
      ]
    }
  },
  {
    slug: "2026-06-10",
    date: "2026-06-10",
    title: {
      en: "Brand cleanup pass and quieter immersive pages",
      ko: "브랜드 정리와 메인/감상 화면 역할 재정리"
    },
    summary: {
      en:
        "Removed logos from immersive pages, turned the home screen into a stronger front-door layout, and reduced Night Sky panel copy so the whole platform feels calmer.",
      ko:
        "감상 페이지에서는 로고를 걷어내고, 메인은 더 대문 같은 구조로 다시 세웠으며, Night Sky 패널 문구와 밀도도 덜어내 전체 플랫폼이 더 차분하게 읽히도록 정리했습니다."
    },
    areas: {
      en: ["Brand cleanup", "Home direction", "Night Sky polish"],
      ko: ["브랜드 정리", "메인 방향 정리", "Night Sky 마감"]
    },
    highlights: {
      en: [
        "Removed page-level logos from Night Sky, Aurora, and Monsoon so immersive scenes can breathe without banner-like branding blocks.",
        "Rebuilt the home hero into a larger front-door composition with a stronger Zeravue logo presence, cleaner alignment, and gentler theme card separation.",
        "Trimmed Night Sky inspector and in-frame constellation copy so the viewer reads less like a tool and more like a quiet viewing space."
      ],
      ko: [
        "Night Sky, Aurora, 깊은 숲의 비 감상 화면에서 페이지 로고를 걷어내, 브랜드 배너보다 장면 자체가 먼저 읽히게 정리했습니다.",
        "메인 히어로는 더 큰 Zeravue 로고와 정렬된 중심축을 기준으로 다시 세워, 대문 같은 첫 인상이 남도록 다듬었습니다.",
        "Night Sky 우측 패널과 시야 별자리 문구를 덜어내, 관측 도구보다 조용한 감상 화면에 더 가깝게 맞췄습니다."
      ]
    },
    next: {
      en: [
        "Reduce Night Sky inspector height and padding a little further without hiding useful information.",
        "Soften theme-card hover behavior so scene selection feels more tactile without turning into a flashy landing page.",
        "Tune Aurora and Monsoon first-view text placement so their entry mood feels as settled as the home page."
      ],
      ko: [
        "Night Sky 우측 inspector 카드 높이와 내부 여백을 조금 더 줄여도 정보가 답답하지 않은지 확인합니다.",
        "메인 테마 카드 hover 반응을 더 부드럽게 다듬어, 과장되지 않게 장면 선택 감각만 살립니다.",
        "Aurora와 깊은 숲의 비 첫 진입 텍스트 위치를 한 번 더 조정해, 홈과 비슷한 안정감을 맞춥니다."
      ]
    }
  },
  {
    slug: "2026-06-09",
    date: "2026-06-09",
    title: {
      en: "Night Sky recovery pass and quieter home flow",
      ko: "Night Sky 복구 점검과 홈 흐름 재정리"
    },
    summary: {
      en:
        "Recovered the Night Sky scene endpoint from a backend time-table failure, cleaned up the home theme cards, and softened English panel density so the viewer feels calmer again.",
      ko:
        "Night Sky 장면 API가 시간 보정 테이블 문제로 멈추던 구간을 복구하고, 홈 테마 카드 흐름을 다시 정리했으며, 영문 패널 밀도도 덜어내 감상 톤을 한 번 더 차분하게 맞췄습니다."
    },
    areas: {
      en: ["Night Sky recovery", "Home polish", "UI density"],
      ko: ["Night Sky 복구", "홈 정리", "UI 밀도 조정"]
    },
    highlights: {
      en: [
        "Fixed the backend sky-scene failure so Night Sky can generate HYG-based scenes again without tripping over stale IERS timing data.",
        "Restructured the home theme cards with clearer eyebrow, title, description, and meta layers so the first screen reads more cleanly.",
        "Trimmed English-facing labels and softened inspector and sketch-list density so Night Sky feels less tool-heavy."
      ],
      ko: [
        "오래된 IERS 시간 보정 데이터 때문에 멈추던 Night Sky 백엔드 장면 생성 구간을 복구해 HYG 기반 하늘 장면이 다시 열리게 했습니다.",
        "홈 테마 카드를 작은 성격표시, 제목, 설명, 메타 흐름으로 다시 묶어 첫 화면이 더 또렷하게 읽히도록 정리했습니다.",
        "영문 라벨과 inspector, 스케치 저장 목록 밀도를 덜어내 Night Sky가 도구보다 감상 화면에 가깝게 느껴지도록 맞췄습니다."
      ]
    },
    next: {
      en: [
        "Add a minimal fullscreen overlay for Night Sky sketch mode so core actions remain reachable without breaking immersion.",
        "Decide whether the dome-style circular sky should stay hidden or return as a calmer support view.",
        "Keep reducing the gap between feature richness and quiet viewing tone in Night Sky."
      ],
      ko: [
        "Night Sky 스케치 모드 전체화면에서도 핵심 기능을 열 수 있는 최소 오버레이를 추가합니다.",
        "원형하늘 뷰를 계속 숨길지, 더 차분한 보조 뷰로 다시 풀지 방향을 정리합니다.",
        "Night Sky의 기능 밀도와 감상 톤 사이 간격을 계속 좁혀갑니다."
      ]
    }
  },
  {
    slug: "2026-06-03",
    date: "2026-06-03",
    title: {
      en: "Aurora polish pass and wind sound asset set",
      ko: "오로라 마감 정리와 바람 사운드 자산화"
    },
    summary: {
      en:
        "Refined Aurora into a more direct immersive flow, reduced visual haze, unified immersive controls with Monsoon, and replaced the weak ambient bed with selectable local wind loops.",
      ko:
        "오로라를 더 직접적인 감상 흐름으로 정리하고, 과한 흐림을 줄였으며, 깊은 숲의 비와 몰입형 조작 규칙을 맞추고, 약했던 앰비언트를 선택 가능한 로컬 바람 루프로 교체했습니다."
    },
    areas: {
      en: ["Aurora polish", "Immersive UI", "Audio assets"],
      ko: ["오로라 마감", "몰입형 UI", "사운드 자산"]
    },
    highlights: {
      en: [
        "Removed the extra landing-style step so Aurora now opens and exits with the same direct flow as other immersive themes.",
        "Reduced blur, restored header visibility, tightened text placement, and removed explanatory copy that competed with the scene.",
        "Generated local wind-loop variants for Aurora and set a colder mountain-wind profile as the default ambient tone."
      ],
      ko: [
        "오로라도 다른 몰입형 테마처럼 중간 단계 없이 바로 열리고 바로 닫히는 흐름으로 다시 맞췄습니다.",
        "블러를 줄이고 로고와 카피 위치를 정리했으며, 장면과 경쟁하던 설명 문구를 덜어냈습니다.",
        "오로라 전용 로컬 바람 루프를 여러 타입으로 만들고, 차가운 설산 바람 톤을 기본 앰비언트로 고정했습니다."
      ]
    },
    next: {
      en: [
        "Keep softening Night Sky so it feels closer to the calmer immersive themes without losing its viewing depth.",
        "Refine fullscreen hide/show rules across immersive themes so the transition feels even cleaner.",
        "Compare Aurora wind variants again and confirm whether the cold profile should remain the long-term default."
      ],
      ko: [
        "Night Sky도 오로라/깊은 숲의 비와 충돌하지 않게 감상 톤을 더 부드럽게 정리합니다.",
        "몰입형 테마 전체화면 전환 시 UI 숨김 규칙을 더 매끈하게 다듬습니다.",
        "오로라 바람 3종을 다시 비교해 차가운 바람이 장기 기본값으로 가장 적절한지 확인합니다."
      ]
    }
  },
  {
    slug: "2026-06-02",
    date: "2026-06-02",
    title: {
      en: "Monsoon Canopy reset and immersive rain rebuild",
      ko: "깊은 숲의 비 방향 재정리와 몰입형 빗소리/비 효과 보강"
    },
    summary: {
      en:
        "Reframed the awkward Rain Window direction into Monsoon Canopy, rebuilt the scene around a rainforest image and canvas rain, and moved ambient sound to local samples for a smoother loop.",
      ko:
        "어색했던 Rain Window 방향을 깊은 숲의 비로 다시 세우고, 우림 배경 이미지와 캔버스 비 레이어를 중심으로 장면을 재구성했으며, 더 자연스러운 루프를 위해 로컬 사운드 샘플로 옮겼습니다."
    },
    areas: {
      en: ["Theme reset", "Atmosphere tuning", "Ambient audio"],
      ko: ["테마 재정리", "분위기 튜닝", "앰비언트 사운드"]
    },
    highlights: {
      en: [
        "Split Monsoon Canopy into its own theme path so it no longer collides with the earlier Rain Window direction.",
        "Replaced weak decorative rain styling with a photo-based jungle backdrop and a dedicated canvas rain layer.",
        "Switched the rain loop and thunder cue to local audio samples to reduce audible seams and make the scene feel steadier."
      ],
      ko: [
        "초기 Rain Window 흔적과 충돌하지 않도록 깊은 숲의 비를 별도 테마 흐름으로 분리했습니다.",
        "약한 장식형 비 스타일 대신, 우림 배경 이미지와 전용 캔버스 비 레이어 중심으로 장면을 다시 세웠습니다.",
        "비 루프와 천둥 큐를 로컬 오디오 샘플로 옮겨 끊김 체감은 줄이고 장면의 안정감을 높였습니다."
      ]
    },
    next: {
      en: [
        "Raise thunder audibility until it is clearly noticeable without breaking the calm tone.",
        "Polish planet/moon/sun selection feedback in Night Sky around a more immersive viewing mood.",
        "Keep tightening shared bottom-control naming and placement rules across immersive themes."
      ],
      ko: [
        "분위기를 해치지 않는 선에서 깊은 숲의 비 천둥 사운드 체감을 더 끌어올립니다.",
        "Night Sky의 행성/달/태양 선택 경험을 감상형 톤에 맞게 더 다듬습니다.",
        "몰입형 테마 공통 하단 컨트롤의 명칭과 위치 규칙을 더 정리합니다."
      ]
    }
  },
  {
    slug: "2026-06-01",
    date: "2026-06-01",
    title: {
      en: "Rain Window first structure and viewing flow alignment",
      ko: "Rain Window 첫 구조와 감상 흐름 정렬"
    },
    summary: {
      en:
        "Added the first Rain Window route into Zeravue, aligned its controls with existing immersive pages, and improved first-entry sound behavior.",
      ko:
        "Rain Window 첫 진입 경로를 Zeravue에 붙이고, 기존 몰입형 페이지와 조작 흐름을 맞췄으며, 첫 진입 사운드 체감을 보강했습니다."
    },
    areas: {
      en: ["Theme expansion", "Immersive controls", "Ambient onboarding"],
      ko: ["테마 확장", "몰입형 컨트롤", "사운드 온보딩"]
    },
    highlights: {
      en: [
        "Connected the first Rain Window theme through home, routing, and dedicated viewer flow.",
        "Aligned fullscreen, sound, and mood controls with the broader Zeravue interaction language.",
        "Improved first-entry ambient activation so the scene feels less silent before the first action."
      ],
      ko: [
        "첫 Rain Window 테마를 홈, 라우팅, 전용 감상 흐름까지 연결했습니다.",
        "전체화면, 사운드, 무드 조작을 Zeravue 공통 감상 톤에 맞게 정리했습니다.",
        "첫 조작 전 너무 조용하게 느껴지지 않도록 앰비언트 시작 감각을 보강했습니다."
      ]
    },
    next: {
      en: [
        "Deepen Rain Window background detail and reduce static scene feeling.",
        "Unify lower overlay structure between Aurora and Rain experiences.",
        "Apply a more consistent fade rule between entry and viewing states."
      ],
      ko: [
        "Rain Window 배경 디테일을 더 보강해 정적인 느낌을 줄입니다.",
        "Aurora와 Rain 경험의 하단 오버레이 구조를 더 통일합니다.",
        "진입 화면과 감상 화면 사이 페이드 규칙을 더 일관되게 맞춥니다."
      ]
    }
  },
  {
    slug: "2026-05-31",
    date: "2026-05-31",
    title: {
      en: "Watch interaction repositioning and theme platform cleanup",
      ko: "Watch 인터랙션 재배치와 테마 플랫폼 구조 정리"
    },
    summary: {
      en:
        "Refined the viewing tone for comfort, repositioned top watch interactions, and reorganized theme registration/routing for easier expansion.",
      ko:
        "감상 톤을 더 편안하게 다듬고, Watch 상단 인터랙션 위치를 재정리했으며, 테마 등록/라우팅 구조를 확장형으로 정리했습니다."
    },
    areas: {
      en: ["Immersive UX", "Watch interaction", "Theme architecture"],
      ko: ["몰입 UX", "Watch 인터랙션", "테마 아키텍처"]
    },
    highlights: {
      en: [
        "Rebalanced night-sky tone to reduce UI competition and improve dwell comfort.",
        "Moved watch/switch controls to a clearer top-right flow with shorter eye travel.",
        "Separated theme registry and route mapping to support future scene expansion."
      ],
      ko: [
        "UI 간섭을 줄이도록 밤하늘 감상 톤과 화면 밀도를 재조정했습니다.",
        "Watch/전환 토글을 우측 상단 흐름으로 정리해 시선 이동을 줄였습니다.",
        "테마 레지스트리와 라우트 매핑을 분리해 신규 장면 확장 경로를 정리했습니다."
      ]
    },
    next: {
      en: [
        "Add one new theme candidate and validate full registration-to-home flow.",
        "Unify overlay naming and spacing across all immersive pages.",
        "Tune transition softness between entry and viewing states."
      ],
      ko: [
        "신규 테마 1종을 붙여 등록-홈 노출 흐름을 실전 검증합니다.",
        "몰입 페이지 간 오버레이 명칭/간격 규칙을 통일합니다.",
        "진입 화면과 감상 화면 전환을 더 부드럽게 다듬습니다."
      ]
    }
  },
  {
    slug: "2026-05-30",
    date: "2026-05-30",
    title: {
      en: "Immersive viewing tone and deploy isolation cleanup",
      ko: "몰입형 감상 톤과 배포 환경 분리 정리"
    },
    summary: {
      en:
        "Adjusted Zeravue away from a strict astronomy-tool tone, improved constellation naming/search, and verified the dev/prod deployment split.",
      ko:
        "Zeravue를 천문 도구보다 몰입형 감상 서비스에 가깝게 정리하고, 별자리 표기/검색과 dev/prod 배포 분리를 점검했습니다."
    },
    areas: {
      en: ["Immersive UX", "Localization", "Deploy isolation"],
      ko: ["몰입 UX", "로컬라이징", "배포 분리"]
    },
    highlights: {
      en: [
        "Added an immersive mode that lets the night-sky canvas take priority over side panels.",
        "Corrected Korean constellation names and added alias search for familiar variants.",
        "Separated dev/prod deployment paths and verified sentinel guards, compose ports, and nginx routing."
      ],
      ko: [
        "좌우 패널보다 밤하늘 캔버스가 우선되는 몰입 모드를 추가했습니다.",
        "한국어 별자리명을 교정하고 익숙한 별칭으로도 검색되도록 보강했습니다.",
        "dev/prod 배포 경로를 분리하고 sentinel, compose 포트, nginx 라우팅을 확인했습니다."
      ]
    },
    next: {
      en: [
        "Further tune Night Sky color and star glow for immersive mode.",
        "Make About and Updates describe Zeravue's healing direction more clearly.",
        "Keep reducing tool-like copy where it distracts from the viewing mood."
      ],
      ko: [
        "몰입 모드의 밤하늘 색감과 별빛 밸런스를 추가 조정합니다.",
        "About과 Updates가 Zeravue의 힐링 방향성을 더 분명히 설명하도록 다듬습니다.",
        "감상 분위기를 방해하는 도구형 문구를 계속 줄입니다."
      ]
    }
  },
  {
    slug: "2026-05-29",
    date: "2026-05-29",
    title: {
      en: "Watch UI density cleanup and stability improvements",
      ko: "Watch UI 밀도 정리와 안정화 개선"
    },
    summary: {
      en: "Moved key controls closer to the canvas, merged long left-panel blocks into a bottom dock, and stabilized observer time feedback.",
      ko: "핵심 조작을 캔버스 근처로 옮기고 좌측 긴 카드들을 하단 도킹으로 통합했으며, 하늘 시각 피드백을 안정화했습니다."
    },
    areas: {
      en: ["Watch UI", "Layout cleanup", "Interaction stability"],
      ko: ["Watch UI", "레이아웃 정리", "상호작용 안정화"]
    },
    highlights: {
      en: [
        "Moved the sky-view switcher into the canvas area.",
        "Merged long control blocks into a bottom dock.",
        "Improved time-shift feedback and the constellation list layout."
      ],
      ko: [
        "하늘 시점 전환을 캔버스 영역 안으로 이동했습니다.",
        "길게 늘어진 제어 블록을 하단 도킹 패널로 통합했습니다.",
        "시간 이동 피드백과 별자리 목록 레이아웃을 개선했습니다."
      ]
    },
    next: {
      en: [
        "Strengthen observer/zenith visual hierarchy.",
        "Improve active constellation storytelling.",
        "Continue reducing overlay density."
      ],
      ko: [
        "올려보기/천정 시각 계층을 보강합니다.",
        "활성 별자리 스토리텔링을 강화합니다.",
        "오버레이 밀도를 계속 정리합니다."
      ]
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
  const homeCopy = platformHomeCopy[language] || platformHomeCopy.en;
  const [showBrandLogo, setShowBrandLogo] = useState(true);
  const [brandLogoSrc, setBrandLogoSrc] = useState("/branding/zeravue-logo.png");
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
        <div className="theme-home-header-top">
          <div className="language-switcher" aria-label="Language">
            <button type="button" aria-pressed={language === "en"} onClick={() => setLanguage("en")}>
              EN
            </button>
            <button type="button" aria-pressed={language === "ko"} onClick={() => setLanguage("ko")}>
              KR
            </button>
          </div>
        </div>
        {showBrandLogo ? (
          <div className="theme-home-brand-hero" aria-hidden="true">
            <img
              className="theme-home-brand-logo"
              src={brandLogoSrc}
              alt="Zeravue logo"
              loading="eager"
              onError={() => {
                if (brandLogoSrc.endsWith(".png")) {
                  setBrandLogoSrc("/branding/zeravue-logo.svg");
                  return;
                }
                setShowBrandLogo(false);
              }}
            />
          </div>
        ) : null}
        <p className="eyebrow">Zeravue</p>
        <h1>{homeCopy.title}</h1>
        <p>{homeCopy.subtitle}</p>
      </header>

      <div id="themes" className="theme-home-grid" aria-label={language === "ko" ? "테마 선택" : "Theme selection"}>
        {platformThemeCards.map((theme) => (
          <a
            key={theme.id}
            className="theme-home-card"
            data-theme-card={theme.id}
            href={theme.href}
            onClick={(event) => enterTheme(event, theme.href)}
          >
            <p className="theme-home-card-eyebrow">{theme.eyebrow?.[language] || theme.eyebrow?.en}</p>
            <div className="theme-home-card-body">
              <strong>{theme.title[language] || theme.title.en}</strong>
              <small>{theme.description[language] || theme.description.en}</small>
            </div>
            <div className="theme-home-card-footer">
              <span className="theme-home-card-meta">{theme.meta?.[language] || theme.meta?.en}</span>
              <span className="theme-home-card-action">{language === "ko" ? "감상 열기" : "Open scene"}</span>
            </div>
          </a>
        ))}
      </div>
      <section className="theme-home-updates">
        <div className="theme-home-updates-header">
          <p className="eyebrow">{language === "ko" ? "업데이트" : "Updates"}</p>
        </div>
        <div className="theme-home-updates-list">
          {buildLogs.slice(0, 2).map((item) => (
            <a key={item.slug} className="theme-home-update-card" href={`/updates/${item.slug}`}>
              <strong>{item.title[language] || item.title.en}</strong>
              <small>{item.summary[language] || item.summary.en}</small>
              <span>{item.date}</span>
            </a>
          ))}
        </div>
        <a className="theme-home-updates-more" href="/updates">
          {language === "ko" ? "업데이트 더보기" : "More updates"}
        </a>
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
        <p>
          {language === "ko"
            ? "최근 작업과 UI 개선 내역을 기록합니다. 각 로그는 작업 의도와 변경 범주를 함께 표시합니다."
            : "Recent product and UI updates with intent and change areas."}
        </p>
      </header>
      <div className="legal-page-sections updates-list-page">
        {buildLogs.map((item) => (
          <section key={item.slug}>
            <h2>
              <a href={`/updates/${item.slug}`}>{item.title[language] || item.title.en}</a>
            </h2>
            <p>{item.summary[language] || item.summary.en}</p>
            {item.areas?.[language]?.length ? (
              <div className="update-area-tags" aria-label={language === "ko" ? "변경 범주" : "Change areas"}>
                {item.areas[language].map((area) => (
                  <span key={area}>{area}</span>
                ))}
              </div>
            ) : null}
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
      <div className="legal-page-sections updates-detail-page">
        {item.areas?.[language]?.length ? (
          <section>
            <h2>{language === "ko" ? "변경 범주" : "Change areas"}</h2>
            <div className="update-area-tags">
              {item.areas[language].map((area) => (
                <span key={area}>{area}</span>
              ))}
            </div>
          </section>
        ) : null}
        {item.highlights?.[language]?.length ? (
          <section>
            <h2>{language === "ko" ? "핵심 변경" : "Highlights"}</h2>
            <ul>
              {item.highlights[language].map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        ) : null}
        {item.next?.[language]?.length ? (
          <section>
            <h2>{language === "ko" ? "다음 작업 후보" : "Next candidates"}</h2>
            <ol>
              {item.next[language].map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ol>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function AboutPage({ language, setLanguage }) {
  const copy = platformAboutCopy[language] || platformAboutCopy.en;

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
      "/monsoon-canopy": {
        title: "Monsoon Canopy · Zeravue",
        description: "A calm tropical rainforest scene with dense rainfall, layered foliage, mist, and sheltered observation."
      },
      "/rain-window": {
        title: "Rain Window · Zeravue",
        description: "A calm rain-window scene with gentle sound and minimal controls for quiet rest."
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
    const updateSlug = path.startsWith("/updates/") ? path.replace("/updates/", "") : "";
    const updateItem = updateSlug ? buildLogs.find((item) => item.slug === updateSlug) : null;
    const resolved = updateItem
      ? {
          title: `${updateItem.title[language] || updateItem.title.en} · Zeravue`,
          description: updateItem.summary[language] || updateItem.summary.en
        }
      : path.startsWith("/updates/")
        ? seoByPath["/updates"]
        : seoByPath[path] || defaults;
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
    const themeRoute = getThemeRouteConfig(path);
    if (themeRoute?.themeId) {
      switchTheme(themeRoute.themeId);
    }
  }, [path, switchTheme]);

  const content = useMemo(() => {
    if (path === "/" || path === "/home") {
      return <HomePage language={language} setLanguage={setLanguage} />;
    }

    const themeRoute = getThemeRouteConfig(path);
    if (themeRoute) {
      return (
        <NightSkyApp
          forcedLanguage={language}
          setForcedLanguage={setLanguage}
          showThemeSwitcher={false}
          auroraRenderer={themeRoute.auroraRenderer || "css"}
        />
      );
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
