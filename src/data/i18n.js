const CONSTELLATION_TRANSLATIONS = {
  Andromeda: { en: "Andromeda", ko: "안드로메다자리" },
  Antlia: { en: "Antlia", ko: "공기펌프자리" },
  Apus: { en: "Apus", ko: "극락조자리" },
  Aquarius: { en: "Aquarius", ko: "물병자리" },
  Aquila: { en: "Aquila", ko: "독수리자리" },
  Ara: { en: "Ara", ko: "제단자리" },
  Aries: { en: "Aries", ko: "양자리" },
  Auriga: { en: "Auriga", ko: "마차부자리" },
  Bootes: { en: "Bootes", ko: "목동자리" },
  Caelum: { en: "Caelum", ko: "조각칼자리" },
  Camelopardalis: { en: "Camelopardalis", ko: "기린자리" },
  Cancer: { en: "Cancer", ko: "게자리" },
  "Canes Venatici": { en: "Canes Venatici", ko: "사냥개자리" },
  "Canis Major": { en: "Canis Major", ko: "큰개자리" },
  "Canis Minor": { en: "Canis Minor", ko: "작은개자리" },
  Capricornus: { en: "Capricornus", ko: "염소자리" },
  Carina: { en: "Carina", ko: "용골자리" },
  Cassiopeia: { en: "Cassiopeia", ko: "카시오페이아자리" },
  Centaurus: { en: "Centaurus", ko: "센타우루스자리" },
  Cepheus: { en: "Cepheus", ko: "세페우스자리" },
  Cetus: { en: "Cetus", ko: "고래자리" },
  Chamaeleon: { en: "Chamaeleon", ko: "카멜레온자리" },
  Circinus: { en: "Circinus", ko: "컴퍼스자리" },
  Columba: { en: "Columba", ko: "비둘기자리" },
  "Coma Berenices": { en: "Coma Berenices", ko: "머리털자리" },
  "Corona Australis": { en: "Corona Australis", ko: "남쪽왕관자리" },
  "Corona Borealis": { en: "Corona Borealis", ko: "북쪽왕관자리" },
  Corvus: { en: "Corvus", ko: "까마귀자리" },
  Crater: { en: "Crater", ko: "컵자리" },
  Crux: { en: "Crux", ko: "남십자자리" },
  Cygnus: { en: "Cygnus", ko: "백조자리" },
  Delphinus: { en: "Delphinus", ko: "돌고래자리" },
  Dorado: { en: "Dorado", ko: "황새치자리" },
  Draco: { en: "Draco", ko: "용자리" },
  Equuleus: { en: "Equuleus", ko: "조랑말자리" },
  Eridanus: { en: "Eridanus", ko: "에리다누스자리" },
  Fornax: { en: "Fornax", ko: "화로자리" },
  Gemini: { en: "Gemini", ko: "쌍둥이자리" },
  Grus: { en: "Grus", ko: "두루미자리" },
  Hercules: { en: "Hercules", ko: "헤르쿨레스자리" },
  Horologium: { en: "Horologium", ko: "시계자리" },
  Hydra: { en: "Hydra", ko: "바다뱀자리" },
  Hydrus: { en: "Hydrus", ko: "물뱀자리" },
  Indus: { en: "Indus", ko: "인디언자리" },
  Lacerta: { en: "Lacerta", ko: "도마뱀자리" },
  Leo: { en: "Leo", ko: "사자자리" },
  "Leo Minor": { en: "Leo Minor", ko: "작은사자자리" },
  Lepus: { en: "Lepus", ko: "토끼자리" },
  Libra: { en: "Libra", ko: "천칭자리" },
  Lupus: { en: "Lupus", ko: "이리자리" },
  Lynx: { en: "Lynx", ko: "살쾡이자리" },
  Lyra: { en: "Lyra", ko: "거문고자리" },
  Mensa: { en: "Mensa", ko: "테이블산자리" },
  Microscopium: { en: "Microscopium", ko: "현미경자리" },
  Monoceros: { en: "Monoceros", ko: "외뿔소자리" },
  Musca: { en: "Musca", ko: "파리자리" },
  Norma: { en: "Norma", ko: "직각자자리" },
  Octans: { en: "Octans", ko: "팔분의자리" },
  Ophiuchus: { en: "Ophiuchus", ko: "뱀주인자리" },
  Orion: { en: "Orion", ko: "오리온자리" },
  Pavo: { en: "Pavo", ko: "공작자리" },
  Pegasus: { en: "Pegasus", ko: "페가수스자리" },
  Perseus: { en: "Perseus", ko: "페르세우스자리" },
  Phoenix: { en: "Phoenix", ko: "불사조자리" },
  Pictor: { en: "Pictor", ko: "화가자리" },
  Pisces: { en: "Pisces", ko: "물고기자리" },
  "Piscis Austrinus": { en: "Piscis Austrinus", ko: "남쪽물고기자리" },
  Puppis: { en: "Puppis", ko: "고물자리" },
  Pyxis: { en: "Pyxis", ko: "나침반자리" },
  Reticulum: { en: "Reticulum", ko: "그물자리" },
  Sagitta: { en: "Sagitta", ko: "화살자리" },
  Sagittarius: { en: "Sagittarius", ko: "궁수자리" },
  Scorpius: { en: "Scorpius", ko: "전갈자리" },
  Sculptor: { en: "Sculptor", ko: "조각가자리" },
  Scutum: { en: "Scutum", ko: "방패자리" },
  Serpens: { en: "Serpens", ko: "뱀자리" },
  Sextans: { en: "Sextans", ko: "육분의자리" },
  Taurus: { en: "Taurus", ko: "황소자리" },
  Telescopium: { en: "Telescopium", ko: "망원경자리" },
  Triangulum: { en: "Triangulum", ko: "삼각형자리" },
  "Triangulum Australe": { en: "Triangulum Australe", ko: "남쪽삼각형자리" },
  Tucana: { en: "Tucana", ko: "큰부리새자리" },
  "Ursa Major": { en: "Ursa Major", ko: "큰곰자리" },
  "Ursa Minor": { en: "Ursa Minor", ko: "작은곰자리" },
  Vela: { en: "Vela", ko: "돛자리" },
  Virgo: { en: "Virgo", ko: "처녀자리" },
  Volans: { en: "Volans", ko: "날치자리" },
  Vulpecula: { en: "Vulpecula", ko: "작은여우자리" }
};

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
      title: "Let the night sky open up around you.",
      subtitle: "Draw it across the night sky.",
      observer: "Observer",
      pageMode: "Page mode",
      pages: {
        watch: "Night Sky",
        sketch: "Sketch Sky"
      },
      viewModeLabel: "Sky view",
      viewModes: {
        space: "Space drift",
        observer: "Observer view",
        panorama: "Panorama view",
        projection: "Dome projection"
      },
      viewModeDescriptions: {
        space: "A floating, in-space feeling where the constellations surround you instead of sitting on a dome.",
        observer: "An upward-looking sky that feels closer to standing under the constellations.",
        panorama: "A flatter, wider night sky that spreads more calmly across the screen.",
        projection: "A fulldome-style fisheye layout prepared for overhead dome or ceiling projection work."
      },
      ambient: {
        on: "Ambient on",
        off: "Ambient off",
        volume: "Ambient volume",
        volumeShort: "Volume",
        waiting: "Ambient waiting",
        running: "Ambient playing",
        hint: "Click, scroll, or tap inside the scene to start the sound."
      },
      zoom: "Zoom",
      zoomIn: "Zoom in",
      zoomOut: "Zoom out",
      controls: "Viewer controls",
      sketchControls: "Sketch controls",
      tonightMood: "Tonight's story",
      constellationFocus: "Constellation focus",
      atmosphere: "Sky atmosphere",
      atmosphereDensity: "Atmosphere depth",
      starGlow: "Star glow",
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
      timeJump: {
        back: "-3 hours",
        tonight: "Tonight 21:00",
        forward: "+3 hours"
      },
      toggles: {
        labels: "Labels",
        constellations: "Constellation lines",
        guides: "Guide grid",
        planets: "Planet markers",
        autoRotate: "Auto rotate"
      },
      focusConstellation: "Focus constellation",
      searchConstellation: "Search constellation",
      searchPlaceholder: "Type a constellation name",
      trackConstellation: "Track selected constellation",
      favoriteConstellations: "Favorite constellations",
      addFavorite: "Save favorite",
      removeFavorite: "Remove favorite",
      noFavoriteConstellations: "No visible favorites yet.",
      sketchLab: "Space canvas",
      startSketching: "Start sketching",
      finishSketching: "Finish sketching",
      newSketch: "New space",
      sketchName: "Space name",
      sketchPlaceholder: "Quiet orbit garden",
      currentSketch: "Current sketch",
      draftSketch: "Draft sketch",
      selectedStars: "Selected stars",
      clearSketch: "Clear space",
      saveSketch: "Save space",
      savedSketch: "Sketch",
      savedSketches: "Saved spaces",
      noSavedSketches: "No saved sketches yet.",
      deleteSketch: "Delete",
      pinSketch: "Pin",
      unpinSketch: "Unpin",
      sketchHint: "Pick a constellation, then add stars. Lines only connect stars inside that constellation. Planets stay separate.",
      addStarTool: "Add star",
      addPlanetTool: "Add planet",
      deleteTool: "Delete object",
      addConstellation: "New constellation",
      duplicateConstellation: "Duplicate constellation",
      presetConstellation: "Ready-made constellation",
      importConstellation: "Import constellation",
      noPresetConstellations: "No visible constellations",
      arrange: {
        left: "Move left",
        right: "Move right",
        up: "Move up",
        down: "Move down",
        bigger: "Make bigger",
        smaller: "Make smaller",
        spread: "Spread out",
        tighten: "Pull in",
        rotateLeft: "Rotate left",
        rotateRight: "Rotate right"
      },
      activeConstellation: "Active constellation",
      constellationName: "Constellation name",
      constellationColor: "Constellation color",
      customConstellation: "Constellation",
      removeConstellation: "Remove constellation",
      customStar: "Star",
      customPlanet: "Planet",
      customStars: "Stars",
      customPlanets: "Planets",
      planetStyle: "Planet style",
      ringedPlanet: "Ringed planet",
      belongsTo: "Belongs to",
      type: "Type",
      creationInspector: "Creation inspector",
      creationPickHint: "Click empty space to place an object, or click an object to inspect it.",
      objectName: "Object name",
      objectSize: "Object size",
      objectColor: "Object color",
      planetRing: "Planet ring",
      removeObject: "Remove object",
      planetPresets: {
        amber: "Amber planet",
        blue: "Blue planet",
        rose: "Rose planet",
        saturn: "Ringed planet"
      },
      constellationFallback: "The sky does not need to explain everything tonight. Let one shape come forward and the rest can stay soft.",
      allSky: "All sky",
      quickFocus: "Quick focus",
      sketchTips: "Sketch tips",
      sketchTipsList: {
        pick: "Pick stars that feel connected.",
        order: "The line follows your click order.",
        save: "Save the pattern when it starts to feel right."
      },
      overlay: {
        modes: {
          space: "A drifting space view where stars feel like they surround you instead of forming a dome",
          observer: "An upward night sky where the constellations hang overhead more naturally",
          panorama: "A wider night sky that stretches gently across the whole frame",
          projection: "A circular fulldome projection layout shaped for dedicated dome or ceiling display"
        },
        inspect: "Click stars to inspect them",
        screensaver: "Pure screensaver mode with slow camera drift",
        draw: "Place stars and planets in your own empty space"
      },
      starInspector: "Star inspector",
      constellationsInFrame: "Constellations in frame",
      magnitude: "Magnitude",
      altitude: "Altitude",
      azimuth: "Azimuth",
      visibility: "Visibility",
      aboveHorizon: "Above horizon",
      belowHorizon: "Below horizon",
      pickHint: "Pick a star to inspect it.",
      cardinals: {
        north: { en: "North", ko: "북" },
        east: { en: "East", ko: "동" },
        south: { en: "South", ko: "남" },
        west: { en: "West", ko: "서" }
      },
      constellationMoods: {
        Orion: {
          en: "Orion feels like a winter lantern. Even when the rest of the sky is busy, those three belt stars gather your attention gently.",
          ko: "오리온자리는 겨울밤의 등불처럼 느껴집니다. 하늘이 복잡해 보여도 허리띠 세 별이 시선을 차분히 모아줍니다."
        },
        Taurus: {
          en: "Taurus arrives with a grounded kind of brightness, as if the sky decided to slow down and hold still for a moment.",
          ko: "황소자리는 단단한 밝음으로 다가옵니다. 하늘이 잠깐 멈춰 서서 숨을 고르는 느낌을 줍니다."
        },
        Gemini: {
          en: "Gemini has a companionable rhythm. Two bright anchors, then a softer trail between them, like a conversation that does not rush.",
          ko: "쌍둥이자리는 함께 걷는 리듬이 있습니다. 두 개의 밝은 기준점과 그 사이의 부드러운 흐름이 서두르지 않는 대화처럼 이어집니다."
        },
        Leo: {
          en: "Leo shapes itself with a confident curve. It is easy to find once the sky gives you that first bright point to follow.",
          ko: "사자자리는 자신감 있는 곡선으로 잡힙니다. 처음 한 점만 눈에 들어오면 그 뒤는 하늘이 스스로 이어줍니다."
        },
        Virgo: {
          en: "Virgo spreads wider than you expect, quiet and patient. It rewards slower looking rather than the first glance.",
          ko: "처녀자리는 생각보다 넓게 퍼져 있고 조용하며 인내심이 있습니다. 첫눈보다 천천히 바라볼 때 더 잘 드러납니다."
        },
        Scorpius: {
          en: "Scorpius has a flowing body line, almost like handwriting across the sky. Once it appears, the surrounding stars feel calmer.",
          ko: "전갈자리는 하늘에 손글씨를 쓰듯 몸선이 흘러갑니다. 한번 보이기 시작하면 주변의 별들도 더 차분하게 정리됩니다."
        },
        Cygnus: {
          en: "Cygnus opens like a gliding wing. It gives the sky a gentle structure without taking away the feeling of open space.",
          ko: "백조자리는 미끄러지듯 펼쳐진 날개 같습니다. 넓은 하늘의 여백은 남겨두면서도 부드러운 구조를 만들어 줍니다."
        },
        Lyra: {
          en: "Lyra is compact and clear, like a bell tone in the dark. Small enough to feel intimate, bright enough to return to easily.",
          ko: "거문고자리는 어둠 속 종소리처럼 작고 또렷합니다. 친밀하게 느껴질 만큼 작고, 다시 찾기 쉬울 만큼 밝습니다."
        },
        Aquila: {
          en: "Aquila runs straight through the dark with a steadier energy. It helps the sky feel directional without becoming rigid.",
          ko: "독수리자리는 어둠을 가로질러 곧게 흐르며 하늘에 방향감을 줍니다. 그렇다고 딱딱해지지는 않고 여전히 부드럽습니다."
        },
        "Ursa Major": {
          en: "Ursa Major is familiar in the best way. It does not ask much of you, only that you look up and let recognition arrive.",
          ko: "큰곰자리는 좋은 의미로 익숙합니다. 무언가를 요구하기보다, 올려다보는 순간 자연스럽게 알아볼 수 있게 해줍니다."
        }
      }
    },
    constellations: CONSTELLATION_TRANSLATIONS,
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
      title: "밤하늘을 천천히 바라볼 수 있는 공간입니다.",
      subtitle: "밤하늘에 그려봐",
      observer: "관측자",
      pageMode: "페이지 모드",
      pages: {
        watch: "밤하늘 감상",
        sketch: "밤하늘 그리기"
      },
      viewModeLabel: "하늘 시점",
      viewModes: {
        space: "우주 시점",
        observer: "관측자 시점",
        panorama: "파노라마 시점",
        projection: "돔 프로젝션"
      },
      viewModeDescriptions: {
        space: "별자리가 돔처럼 얹히기보다, 내가 우주에 떠 있는 듯 주변을 감싸는 시점입니다.",
        observer: "별자리 아래에 서서 올려다보는 느낌에 더 가까운 시점입니다.",
        panorama: "화면 전체에 하늘이 넓게 퍼지는 더 평평한 감상용 시점입니다.",
        projection: "위쪽으로 쏘는 전용 프로젝터를 염두에 둔 fulldome 형태의 원형 투영 시점입니다."
      },
      ambient: {
        on: "앰비언트 켜기",
        off: "앰비언트 끄기",
        volume: "앰비언트 볼륨",
        volumeShort: "볼륨",
        waiting: "앰비언트 대기 중",
        running: "앰비언트 재생 중",
        hint: "장면 안에서 클릭하거나 스크롤하면 사운드가 시작됩니다."
      },
      zoom: "줌",
      zoomIn: "줌인",
      zoomOut: "줌아웃",
      controls: "뷰어 제어",
      sketchControls: "스케치 제어",
      tonightMood: "오늘 밤의 분위기",
      constellationFocus: "별자리 초점",
      atmosphere: "하늘 분위기",
      atmosphereDensity: "배경 농도",
      starGlow: "별빛 강도",
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
      timeJump: {
        back: "-3시간",
        tonight: "오늘 밤 21:00",
        forward: "+3시간"
      },
      toggles: {
        labels: "이름 라벨",
        constellations: "별자리 선",
        guides: "가이드 격자",
        planets: "행성 마커",
        autoRotate: "자동 회전"
      },
      focusConstellation: "강조할 별자리",
      searchConstellation: "별자리 검색",
      searchPlaceholder: "별자리 이름 검색",
      trackConstellation: "선택한 별자리 추적",
      favoriteConstellations: "즐겨찾는 별자리",
      addFavorite: "즐겨찾기 저장",
      removeFavorite: "즐겨찾기 해제",
      noFavoriteConstellations: "아직 보이는 즐겨찾기 별자리가 없습니다.",
      sketchLab: "우주 캔버스",
      startSketching: "스케치 시작",
      finishSketching: "스케치 종료",
      newSketch: "새 우주",
      sketchName: "우주 이름",
      sketchPlaceholder: "조용한 궤도 정원",
      currentSketch: "현재 우주",
      draftSketch: "임시 우주",
      selectedStars: "선택한 별",
      clearSketch: "우주 비우기",
      saveSketch: "우주 저장",
      savedSketch: "우주",
      savedSketches: "저장한 우주",
      noSavedSketches: "아직 저장한 우주가 없습니다.",
      deleteSketch: "삭제",
      pinSketch: "고정",
      unpinSketch: "고정 해제",
      sketchHint: "별자리를 선택한 뒤 별을 추가하세요. 선은 해당 별자리 안의 별끼리만 이어지고, 행성은 따로 놓입니다.",
      addStarTool: "별 추가",
      addPlanetTool: "행성 추가",
      deleteTool: "오브젝트 삭제",
      addConstellation: "새 별자리",
      duplicateConstellation: "별자리 복제",
      presetConstellation: "완성된 별자리",
      importConstellation: "별자리 불러오기",
      noPresetConstellations: "불러올 별자리가 없습니다.",
      arrange: {
        left: "왼쪽으로",
        right: "오른쪽으로",
        up: "위로",
        down: "아래로",
        bigger: "크게",
        smaller: "작게",
        spread: "퍼뜨리기",
        tighten: "모으기",
        rotateLeft: "왼쪽 회전",
        rotateRight: "오른쪽 회전"
      },
      activeConstellation: "현재 별자리",
      constellationName: "별자리 이름",
      constellationColor: "별자리 색상",
      customConstellation: "별자리",
      removeConstellation: "별자리 제거",
      customStar: "별",
      customPlanet: "행성",
      customStars: "별",
      customPlanets: "행성",
      planetStyle: "행성 스타일",
      ringedPlanet: "고리 행성",
      belongsTo: "소속",
      type: "종류",
      creationInspector: "창작 오브젝트",
      creationPickHint: "빈 우주를 눌러 오브젝트를 놓거나, 오브젝트를 눌러 정보를 확인하세요.",
      objectName: "오브젝트 이름",
      objectSize: "오브젝트 크기",
      objectColor: "오브젝트 색상",
      planetRing: "행성 고리",
      removeObject: "오브젝트 제거",
      planetPresets: {
        amber: "호박빛 행성",
        blue: "푸른 행성",
        rose: "장밋빛 행성",
        saturn: "고리 행성"
      },
      constellationFallback: "오늘 밤 하늘이 모든 걸 설명할 필요는 없습니다. 한 개의 모양만 또렷하게 보고, 나머지는 부드럽게 흘려두어도 괜찮습니다.",
      allSky: "전체 하늘",
      quickFocus: "빠른 강조",
      sketchTips: "스케치 팁",
      sketchTipsList: {
        pick: "서로 이어지고 싶어 보이는 별을 골라보세요.",
        order: "선은 클릭한 순서대로 이어집니다.",
        save: "마음에 드는 흐름이 나오면 저장하세요."
      },
      overlay: {
        modes: {
          space: "별자리가 돔처럼 얹히지 않고, 우주에서 둘러싸인 듯 보이는 시점",
          observer: "머리 위로 별자리가 걸린 듯한, 올려다보는 밤하늘",
          panorama: "화면 전체에 하늘이 더 넓게 펼쳐지는 파노라마 밤하늘",
          projection: "전용 천장·돔 프로젝션을 위한 원형 fulldome 투영 시점"
        },
        inspect: "별을 눌러 상세 정보를 확인",
        screensaver: "느린 카메라 전환으로 감상하는 화면보호기 모드",
        draw: "빈 우주에 나만의 별과 행성을 배치하세요"
      },
      starInspector: "별 정보",
      constellationsInFrame: "현재 시야의 별자리",
      magnitude: "등급",
      altitude: "고도",
      azimuth: "방위각",
      visibility: "가시성",
      aboveHorizon: "지평선 위",
      belowHorizon: "지평선 아래",
      pickHint: "별을 선택해 정보를 확인하세요.",
      cardinals: {
        north: { en: "North", ko: "북" },
        east: { en: "East", ko: "동" },
        south: { en: "South", ko: "남" },
        west: { en: "West", ko: "서" }
      },
      constellationMoods: {
        Orion: {
          en: "Orion feels like a winter lantern. Even when the rest of the sky is busy, those three belt stars gather your attention gently.",
          ko: "오리온자리는 겨울밤의 등불처럼 느껴집니다. 하늘이 복잡해 보여도 허리띠 세 별이 시선을 차분히 모아줍니다."
        },
        Taurus: {
          en: "Taurus arrives with a grounded kind of brightness, as if the sky decided to slow down and hold still for a moment.",
          ko: "황소자리는 단단한 밝음으로 다가옵니다. 하늘이 잠깐 멈춰 서서 숨을 고르는 느낌을 줍니다."
        },
        Gemini: {
          en: "Gemini has a companionable rhythm. Two bright anchors, then a softer trail between them, like a conversation that does not rush.",
          ko: "쌍둥이자리는 함께 걷는 리듬이 있습니다. 두 개의 밝은 기준점과 그 사이의 부드러운 흐름이 서두르지 않는 대화처럼 이어집니다."
        },
        Leo: {
          en: "Leo shapes itself with a confident curve. It is easy to find once the sky gives you that first bright point to follow.",
          ko: "사자자리는 자신감 있는 곡선으로 잡힙니다. 처음 한 점만 눈에 들어오면 그 뒤는 하늘이 스스로 이어줍니다."
        },
        Virgo: {
          en: "Virgo spreads wider than you expect, quiet and patient. It rewards slower looking rather than the first glance.",
          ko: "처녀자리는 생각보다 넓게 퍼져 있고 조용하며 인내심이 있습니다. 첫눈보다 천천히 바라볼 때 더 잘 드러납니다."
        },
        Scorpius: {
          en: "Scorpius has a flowing body line, almost like handwriting across the sky. Once it appears, the surrounding stars feel calmer.",
          ko: "전갈자리는 하늘에 손글씨를 쓰듯 몸선이 흘러갑니다. 한번 보이기 시작하면 주변의 별들도 더 차분하게 정리됩니다."
        },
        Cygnus: {
          en: "Cygnus opens like a gliding wing. It gives the sky a gentle structure without taking away the feeling of open space.",
          ko: "백조자리는 미끄러지듯 펼쳐진 날개 같습니다. 넓은 하늘의 여백은 남겨두면서도 부드러운 구조를 만들어 줍니다."
        },
        Lyra: {
          en: "Lyra is compact and clear, like a bell tone in the dark. Small enough to feel intimate, bright enough to return to easily.",
          ko: "거문고자리는 어둠 속 종소리처럼 작고 또렷합니다. 친밀하게 느껴질 만큼 작고, 다시 찾기 쉬울 만큼 밝습니다."
        },
        Aquila: {
          en: "Aquila runs straight through the dark with a steadier energy. It helps the sky feel directional without becoming rigid.",
          ko: "독수리자리는 어둠을 가로질러 곧게 흐르며 하늘에 방향감을 줍니다. 그렇다고 딱딱해지지는 않고 여전히 부드럽습니다."
        },
        "Ursa Major": {
          en: "Ursa Major is familiar in the best way. It does not ask much of you, only that you look up and let recognition arrive.",
          ko: "큰곰자리는 좋은 의미로 익숙합니다. 무언가를 요구하기보다, 올려다보는 순간 자연스럽게 알아볼 수 있게 해줍니다."
        }
      }
    },
    constellations: CONSTELLATION_TRANSLATIONS,
  }
};

export function getInitialLanguage() {
  const saved = window.localStorage.getItem("planetarium-language");
  if (saved === "ko" || saved === "en") {
    return saved;
  }

  return navigator.language.toLowerCase().startsWith("ko") ? "ko" : "en";
}
