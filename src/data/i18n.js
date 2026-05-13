export const translations = {
  en: {
    languageName: "English",
    nav: {
      observatory: "Observatory",
      sky: "My Sky",
      zodiac: "Zodiac",
      planets: "Planets",
      nasa: "NASA Feed"
    },
    hero: {
      eyebrow: "Interactive planetarium portfolio",
      title: "Explore real planets, zodiac constellations, and tonight's visible sky.",
      lede:
        "A richer astronomy showcase with NASA planet imagery, animated orbital motion, shooting stars, zodiac maps, and location-aware observing guidance.",
      planetsAction: "Explore planets",
      zodiacAction: "View zodiac"
    },
    tracking: {
      label: "Now tracking",
      type: "Type",
      moons: "Moons",
      day: "Day",
      credit: "Image credit"
    },
    controls: {
      pause: "Pause",
      resume: "Resume",
      dateLabel: "APOD date",
      loadDate: "Load date",
      random: "Random image"
    },
    sky: {
      eyebrow: "Location-aware sky",
      title: "Find zodiac constellations visible from your location.",
      body:
        "Allow location access to estimate which zodiac constellations are above your horizon right now. Results use your browser location and local sidereal time, so they are best treated as observing guidance rather than telescope-grade ephemerides.",
      button: "Use my location",
      waiting: "Waiting for location permission.",
      unavailable: "Location is unavailable in this browser.",
      denied: "Location permission was denied.",
      ready: "Visible now near your sky",
      latitude: "Latitude",
      longitude: "Longitude",
      altitude: "Altitude",
      direction: "Direction",
      quality: {
        excellent: "Excellent",
        good: "Good",
        low: "Low",
        below: "Below horizon"
      }
    },
    zodiac: {
      eyebrow: "Zodiac sky map",
      title: "Select a zodiac sign to draw its constellation.",
      body:
        "The constellation layer uses recognizable simplified star patterns, bright-star labels, and approximate sky positions for visibility calculations.",
      realPhoto: "Real night sky photograph",
      imageCredit: "Photo credit",
      imageLicense: "License",
      season: "Sun sign date",
      brightStar: "Bright star"
    },
    planets: {
      eyebrow: "Solar system",
      title: "Choose a planet to focus the sky.",
      source: "NASA source"
    },
    apod: {
      eyebrow: "NASA Astronomy Picture of the Day",
      video: "Open NASA video"
    },
    viewer: {
      eyebrow: "3D planetarium",
      title: "Read the sky as a labeled 3D dome instead of a cloud of anonymous points.",
      observer: "Observer",
      pageMode: "Page mode",
      pages: {
        watch: "Stargaze",
        sketch: "Sketch"
      },
      controls: "Viewer controls",
      sketchControls: "Sketch controls",
      latitude: "Latitude",
      longitude: "Longitude",
      observedAt: "Observed at",
      limitingMagnitude: "Limiting magnitude",
      maxStars: "Star density",
      catalog: "Catalog",
      useLocation: "Use my location",
      enterFullscreen: "Fullscreen",
      exitFullscreen: "Exit fullscreen",
      sceneStatus: "Scene status",
      status: "Status",
      visibleStars: "Visible stars",
      visibleConstellations: "Visible constellations",
      loading: "Generating the sky scene...",
      toggles: {
        labels: "Labels",
        constellations: "Constellation lines",
        guides: "Guide grid",
        planets: "Planet markers",
        autoRotate: "Auto rotate"
      },
      focusConstellation: "Focus constellation",
      sketchLab: "Sketch lab",
      startSketching: "Start sketching",
      finishSketching: "Finish sketching",
      newSketch: "New sketch",
      sketchName: "Sketch name",
      sketchPlaceholder: "Summer triangle idea",
      currentSketch: "Current sketch",
      draftSketch: "Draft sketch",
      selectedStars: "Selected stars",
      clearSketch: "Clear draft",
      saveSketch: "Save sketch",
      savedSketch: "Sketch",
      savedSketches: "Saved sketches",
      noSavedSketches: "No saved sketches yet.",
      deleteSketch: "Delete",
      sketchHint: "Turn sketch mode on, then click stars in order to connect your own pattern.",
      allSky: "All sky",
      quickFocus: "Quick focus",
      sketchTips: "Sketch tips",
      sketchTipsList: {
        pick: "Pick stars that feel connected.",
        order: "The line follows your click order.",
        save: "Save the pattern when it starts to feel right."
      },
      overlay: {
        horizon: "Horizon ring with cardinal directions",
        motion: "Mouse parallax and rotating dome",
        inspect: "Click stars and planets to inspect them",
        draw: "Sketch mode records stars in the order you click"
      },
      starInspector: "Star inspector",
      planetInspector: "Planet inspector",
      constellationsInFrame: "Constellations in frame",
      planetsBand: "Tracked planets",
      magnitude: "Magnitude",
      altitude: "Altitude",
      azimuth: "Azimuth",
      visibility: "Visibility",
      aboveHorizon: "Above horizon",
      belowHorizon: "Below horizon",
      pickHint: "Pick a star or planet to inspect it.",
      planetType: "Type",
      orbitBand: "Orbit band",
      moons: "Moons",
      cardinals: {
        north: { en: "North", ko: "북" },
        east: { en: "East", ko: "동" },
        south: { en: "South", ko: "남" },
        west: { en: "West", ko: "서" }
      }
    },
    constellations: {
      "Ursa Minor": { en: "Ursa Minor", ko: "작은곰자리" },
      "Ursa Major": { en: "Ursa Major", ko: "큰곰자리" },
      Orion: { en: "Orion", ko: "오리온자리" },
      "Canis Major": { en: "Canis Major", ko: "큰개자리" },
      "Canis Minor": { en: "Canis Minor", ko: "작은개자리" },
      Auriga: { en: "Auriga", ko: "마차부자리" },
      Taurus: { en: "Taurus", ko: "황소자리" },
      Gemini: { en: "Gemini", ko: "쌍둥이자리" },
      Leo: { en: "Leo", ko: "사자자리" },
      Virgo: { en: "Virgo", ko: "처녀자리" },
      Bootes: { en: "Bootes", ko: "목동자리" },
      Scorpius: { en: "Scorpius", ko: "전갈자리" },
      Lyra: { en: "Lyra", ko: "거문고자리" },
      Cygnus: { en: "Cygnus", ko: "백조자리" },
      Aquila: { en: "Aquila", ko: "독수리자리" },
      "Piscis Austrinus": { en: "Piscis Austrinus", ko: "남쪽물고기자리" },
      Aries: { en: "Aries", ko: "양자리" }
    },
    planetNames: {
      Mercury: "Mercury",
      Venus: "Venus",
      Earth: "Earth",
      Mars: "Mars",
      Jupiter: "Jupiter",
      Saturn: "Saturn",
      Uranus: "Uranus",
      Neptune: "Neptune"
    },
    planetTypes: {
      Terrestrial: "Terrestrial",
      "Gas giant": "Gas giant",
      "Ice giant": "Ice giant"
    }
  },
  ko: {
    languageName: "한국어",
    nav: {
      observatory: "관측실",
      sky: "내 하늘",
      zodiac: "황도 12궁",
      planets: "행성",
      nasa: "NASA 피드"
    },
    hero: {
      eyebrow: "인터랙티브 천문관 포트폴리오",
      title: "실제 행성 이미지, 황도 별자리, 오늘 밤 보이는 하늘을 탐험하세요.",
      lede:
        "NASA 행성 사진, 행성 궤도 애니메이션, 별똥별, 황도 별자리 지도, 위치 기반 관측 가이드를 담은 천문 쇼케이스입니다.",
      planetsAction: "행성 보기",
      zodiacAction: "황도 보기"
    },
    tracking: {
      label: "현재 추적",
      type: "분류",
      moons: "위성",
      day: "하루",
      credit: "이미지 출처"
    },
    controls: {
      pause: "정지",
      resume: "재생",
      dateLabel: "APOD 날짜",
      loadDate: "날짜 불러오기",
      random: "랜덤 이미지"
    },
    sky: {
      eyebrow: "위치 기반 하늘",
      title: "내 위치에서 지금 볼 수 있는 황도 별자리를 찾아보세요.",
      body:
        "위치 권한을 허용하면 현재 브라우저 위치와 지방항성시를 이용해 지평선 위에 떠 있는 황도 별자리를 추정합니다. 망원경급 정밀 천문력보다는 관측 가이드로 봐주세요.",
      button: "내 위치 사용",
      waiting: "위치 권한을 기다리는 중입니다.",
      unavailable: "이 브라우저에서는 위치 기능을 사용할 수 없습니다.",
      denied: "위치 권한이 거부되었습니다.",
      ready: "지금 하늘에서 보기 좋은 별자리",
      latitude: "위도",
      longitude: "경도",
      altitude: "고도",
      direction: "방향",
      quality: {
        excellent: "매우 좋음",
        good: "좋음",
        low: "낮음",
        below: "지평선 아래"
      }
    },
    zodiac: {
      eyebrow: "황도 별자리 지도",
      title: "별자리를 선택하면 하늘에 별자리 패턴이 그려집니다.",
      body:
        "별자리 레이어는 알아보기 쉬운 대표 별 연결선, 밝은 별 이름, 위치 기반 관측 계산을 위한 대략적인 하늘 좌표를 사용합니다.",
      realPhoto: "실제 밤하늘 촬영 사진",
      imageCredit: "사진 출처",
      imageLicense: "라이선스",
      season: "태양궁 기간",
      brightStar: "대표 별"
    },
    planets: {
      eyebrow: "태양계",
      title: "행성을 선택해 하늘의 초점을 바꿔보세요.",
      source: "NASA 원본"
    },
    apod: {
      eyebrow: "NASA 오늘의 천문 사진",
      video: "NASA 비디오 열기"
    },
    viewer: {
      eyebrow: "3D 플라네타리움",
      title: "이름 모를 점 구름이 아니라, 식별 가능한 하늘을 3D 돔으로 읽어보세요.",
      observer: "관측자",
      pageMode: "페이지 모드",
      pages: {
        watch: "별멍",
        sketch: "스케치"
      },
      controls: "뷰어 제어",
      sketchControls: "스케치 제어",
      latitude: "위도",
      longitude: "경도",
      observedAt: "관측 시각",
      limitingMagnitude: "제한 등급",
      maxStars: "별 밀도",
      catalog: "카탈로그",
      useLocation: "내 위치 사용",
      enterFullscreen: "전체 화면",
      exitFullscreen: "전체 화면 종료",
      sceneStatus: "장면 상태",
      status: "상태",
      visibleStars: "보이는 별",
      visibleConstellations: "보이는 별자리",
      loading: "하늘 장면을 생성하는 중입니다...",
      toggles: {
        labels: "이름 라벨",
        constellations: "별자리 선",
        guides: "가이드 격자",
        planets: "행성 마커",
        autoRotate: "자동 회전"
      },
      focusConstellation: "강조할 별자리",
      sketchLab: "스케치 실험실",
      startSketching: "스케치 시작",
      finishSketching: "스케치 종료",
      newSketch: "새 스케치",
      sketchName: "스케치 이름",
      sketchPlaceholder: "여름 대삼각형 아이디어",
      currentSketch: "현재 스케치",
      draftSketch: "임시 스케치",
      selectedStars: "선택한 별",
      clearSketch: "임시 스케치 비우기",
      saveSketch: "스케치 저장",
      savedSketch: "스케치",
      savedSketches: "저장한 스케치",
      noSavedSketches: "아직 저장한 스케치가 없습니다.",
      deleteSketch: "삭제",
      sketchHint: "스케치 모드를 켠 뒤 별을 순서대로 눌러 나만의 별자리 선을 그려보세요.",
      allSky: "전체 하늘",
      quickFocus: "빠른 강조",
      sketchTips: "스케치 팁",
      sketchTipsList: {
        pick: "서로 이어지고 싶어 보이는 별을 골라보세요.",
        order: "선은 클릭한 순서대로 이어집니다.",
        save: "마음에 드는 흐름이 나오면 저장하세요."
      },
      overlay: {
        horizon: "방위 표시가 붙은 지평선 링",
        motion: "마우스 시차와 회전하는 하늘 돔",
        inspect: "별과 행성을 눌러 상세 정보를 확인",
        draw: "스케치 모드에서는 클릭한 순서대로 별이 이어집니다"
      },
      starInspector: "별 정보",
      planetInspector: "행성 정보",
      constellationsInFrame: "현재 시야의 별자리",
      planetsBand: "추적 중인 행성",
      magnitude: "등급",
      altitude: "고도",
      azimuth: "방위각",
      visibility: "가시성",
      aboveHorizon: "지평선 위",
      belowHorizon: "지평선 아래",
      pickHint: "별이나 행성을 선택해 정보를 확인하세요.",
      planetType: "분류",
      orbitBand: "궤도 밴드",
      moons: "위성",
      cardinals: {
        north: { en: "North", ko: "북" },
        east: { en: "East", ko: "동" },
        south: { en: "South", ko: "남" },
        west: { en: "West", ko: "서" }
      }
    },
    constellations: {
      "Ursa Minor": { en: "Ursa Minor", ko: "작은곰자리" },
      "Ursa Major": { en: "Ursa Major", ko: "큰곰자리" },
      Orion: { en: "Orion", ko: "오리온자리" },
      "Canis Major": { en: "Canis Major", ko: "큰개자리" },
      "Canis Minor": { en: "Canis Minor", ko: "작은개자리" },
      Auriga: { en: "Auriga", ko: "마차부자리" },
      Taurus: { en: "Taurus", ko: "황소자리" },
      Gemini: { en: "Gemini", ko: "쌍둥이자리" },
      Leo: { en: "Leo", ko: "사자자리" },
      Virgo: { en: "Virgo", ko: "처녀자리" },
      Bootes: { en: "Bootes", ko: "목동자리" },
      Scorpius: { en: "Scorpius", ko: "전갈자리" },
      Lyra: { en: "Lyra", ko: "거문고자리" },
      Cygnus: { en: "Cygnus", ko: "백조자리" },
      Aquila: { en: "Aquila", ko: "독수리자리" },
      "Piscis Austrinus": { en: "Piscis Austrinus", ko: "남쪽물고기자리" },
      Aries: { en: "Aries", ko: "양자리" }
    },
    planetNames: {
      Mercury: "수성",
      Venus: "금성",
      Earth: "지구",
      Mars: "화성",
      Jupiter: "목성",
      Saturn: "토성",
      Uranus: "천왕성",
      Neptune: "해왕성"
    },
    planetTypes: {
      Terrestrial: "지구형 행성",
      "Gas giant": "가스 행성",
      "Ice giant": "얼음 행성"
    }
  }
};

export function getInitialLanguage() {
  const saved = window.localStorage.getItem("planetarium-language");
  if (saved === "ko" || saved === "en") {
    return saved;
  }

  return navigator.language.toLowerCase().startsWith("ko") ? "ko" : "en";
}
