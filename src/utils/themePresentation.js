import { VIEW_MODE_ORDER } from "./viewerState.js";

export function getThemeHeaderCopy({ auroraEnabled, language, dictionary }) {
  return {
    eyebrow: auroraEnabled ? "Zeravue · Aurora Night" : dictionary.viewer.eyebrow,
    title: auroraEnabled
      ? language === "ko"
        ? "오로라의 흐름을 천천히 바라보는 공간입니다."
        : "A quiet space to watch the aurora drift."
      : dictionary.viewer.title,
    subtitle: auroraEnabled
      ? language === "ko"
        ? "별자리 분석보다 분위기 감상에 집중하세요."
        : "Focus on atmosphere first, not star analysis."
      : dictionary.viewer.subtitle
  };
}

export function getThemeViewModes(currentTheme) {
  const supported = Array.isArray(currentTheme?.viewModes) && currentTheme.viewModes.length ? currentTheme.viewModes : VIEW_MODE_ORDER;
  return VIEW_MODE_ORDER.filter((mode) => supported.includes(mode));
}
