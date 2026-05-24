export const auroraNightTheme = {
  id: "aurora-night",
  name: "Aurora Night",
  displayName: {
    en: "Aurora Night",
    ko: "오로라의 밤"
  },
  subtitle: {
    en: "Slow ribbons of light over a polar sky",
    ko: "극야 위를 흐르는 느린 빛의 커튼"
  },
  description: {
    en: "A calm aurora-focused viewing theme that keeps Zeravue's gentle interaction style.",
    ko: "Zeravue의 부드러운 인터랙션을 유지한 오로라 중심 감상 테마입니다."
  },
  colors: {
    background: "#03101a",
    accent: "#5fe7cb",
    accentSoft: "#9cf8df",
    text: "#e5fff8"
  },
  viewModes: ["space", "observer", "projection"],
  defaultViewMode: "observer",
  features: {
    sketching: false,
    favorites: true,
    tracking: true,
    observerMode: true,
    fullscreen: true,
    ambientAudio: true
  }
};
