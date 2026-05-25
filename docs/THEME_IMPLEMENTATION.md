# Theme System Implementation Guide

## Current Status

✅ **Phase 1 Complete: Night Sky Theme Refactored**

The night-sky theme has been extracted into a reusable configuration system.

### Files Created

1. **`src/data/themes/nightSky.config.js`**
   - Defines night-sky theme configuration
   - Central place for visual design, controls, rendering defaults
   - Exported: `nightSkyTheme`, `getThemeById()`, `getAllThemes()`

2. **`src/context/ThemeContext.jsx`**
   - React context for theme management
   - Provides: `ThemeProvider`, `useTheme()`
   - Persists theme selection to localStorage

3. **`src/data/themes/auroraKnight.config.js`** (Reference)
   - Example of how aurora theme would be structured
   - Not yet implemented - reference only

4. **`docs/THEME_ARCHITECTURE.md`**
   - Complete architecture design and principles
   - Migration strategy for future themes

### Changes to Existing Files

- **`src/main.jsx`**: Added `<ThemeProvider>` wrapper
- **`src/App.jsx`**: 
  - Added `useTheme()` hook
  - State defaults now come from `currentTheme.rendering` and `currentTheme.observer`
  - Backward compatible - still works exactly as before

## How to Use Themes

### In Components

```jsx
import { useTheme } from "@/context/ThemeContext.jsx"

function MyComponent() {
  const { currentTheme, themes, switchTheme } = useTheme()
  
  return (
    <div>
      <p>Current theme: {currentTheme.displayName.en}</p>
      <button onClick={() => switchTheme("aurora-night")}>
        Switch to Aurora
      </button>
    </div>
  )
}
```

### In Configuration

```jsx
import { nightSkyTheme } from "@/data/themes/nightSky.config.js"

const defaults = {
  atmosphereStrength: nightSkyTheme.rendering.atmosphereStrength,
  colors: nightSkyTheme.colors
}
```

## Adding a New Theme

### 1. Create Theme Config

```js
// src/data/themes/underwater.config.js
export const underwaterTheme = {
  id: "underwater",
  displayName: { en: "Underwater", ko: "수중" },
  colors: { ... },
  viewModes: ["observer", "panorama"],
  dataSource: "underwater",
  // ... other config
}
```

### 2. Register Theme

```js
// src/data/themes/nightSky.config.js
export function getAllThemes() {
  return [
    nightSkyTheme,
    auroraTheme,        // When ready
    underwaterTheme     // When ready
  ]
}
```

### 3. Create Theme-Specific Components

```jsx
// src/components/themes/underwater/UnderwaterCanvas.jsx
export function UnderwaterCanvas({ ... }) {
  // Aurora-specific rendering
  return <group> ... </group>
}
```

### 4. Update Canvas Renderer

In `PlanetariumCanvas.jsx`, conditionally render theme-specific components:

```jsx
function SceneContents({ ... }) {
  const { currentTheme } = useTheme()
  
  return (
    <>
      {currentTheme.id === "night-sky" && <MilkyWayBand ... />}
      {currentTheme.id === "underwater" && <UnderwaterParticles ... />}
      {/* ... */}
    </>
  )
}
```

## Testing Themes Locally

1. **Night Sky** (default)
   - Should work exactly as before
   - Check localStorage for "planetarium-theme" key

2. **Add Aurora Theme**
   - Uncomment `auroraTheme` in `getAllThemes()`
   - Add theme switcher UI to topbar
   - Test theme switching and persistence

3. **Check Rendering**
   - Verify colors, defaults, controls load correctly
   - Check that favorites persist across theme switches

## Future: Theme Switcher UI

A simple theme selector can be added to the topbar:

```jsx
function ThemeSwitcher() {
  const { currentTheme, themes, switchTheme } = useTheme()
  
  return (
    <div className="theme-switcher">
      {themes.map(theme => (
        <button
          key={theme.id}
          className={currentTheme.id === theme.id ? "active" : ""}
          onClick={() => switchTheme(theme.id)}
        >
          {theme.displayName.en}
        </button>
      ))}
    </div>
  )
}
```

## Architecture Benefits

### ✅ Scalable
- Adding new themes requires only config + components
- No changes to core App logic

### ✅ Maintainable
- Theme data centralized
- Easy to update colors, controls, rendering
- Clear separation of concerns

### ✅ Extensible
- Themes can define custom features (e.g., aurora-specific geomagnetic data)
- Support for theme-specific hooks (e.g., `useAuroraIntensity()`)

### ✅ Backward Compatible
- Existing code still works
- Gradual migration possible

## Next Steps

1. **Create Theme Switcher UI** (Optional)
   - Add theme selector to topbar
   - Show available themes

2. **Implement Aurora Theme**
   - Create aurora data source
   - Aurora-specific canvas components
   - Test theme switching

3. **Add Underwater Theme**
   - Design theme config
   - Particle/water rendering
   - Data integration

4. **Document Theme Contribution Guidelines**
   - How to propose new themes
   - Design review process
   - Community contribution workflow

## Questions?

Refer to:
- `THEME_ARCHITECTURE.md` - Design principles
- `src/data/themes/nightSky.config.js` - Reference implementation
- `src/data/themes/auroraKnight.config.js` - Future theme example
