import { VIEW_MODE_ORDER } from "./viewerState.js";

export function getThemeHeaderCopy({ currentThemeId, language, dictionary }) {
  if (currentThemeId === "aurora-night") {
    return {
      eyebrow: "Zeravue · Aurora Night",
      title: language === "ko" ? "오로라의 흐름을 천천히 바라보는 공간입니다." : "A quiet space to watch the aurora drift.",
      subtitle: language === "ko" ? "별자리 분석보다 분위기 감상에 집중하세요." : "Focus on atmosphere first, not star analysis."
    };
  }

  if (currentThemeId === "rain-window") {
    return {
      eyebrow: "Zeravue · Rain Window",
      title: language === "ko" ? "비가 흐르는 창가에 잠시 머무는 공간입니다." : "A calm window scene with slow rain and night light.",
      subtitle: language === "ko" ? "조용한 빗소리와 함께 호흡을 천천히 맞춰보세요." : "Settle into gentle rain sound and a slower pace."
    };
  }

  return {
    eyebrow: dictionary.viewer.eyebrow,
    title: dictionary.viewer.title,
    subtitle: dictionary.viewer.subtitle
  };
}

export function getThemeViewModes(currentTheme) {
  const supported = Array.isArray(currentTheme?.viewModes) && currentTheme.viewModes.length ? currentTheme.viewModes : VIEW_MODE_ORDER;
  return VIEW_MODE_ORDER.filter((mode) => supported.includes(mode));
}
