import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@app_theme_mode'; // persisted key

// ── Colour tokens ─────────────────────────────────────────────────────────────
export const LIGHT_THEME = {
  isDark: false,

  // Backgrounds
  bg:          '#F7F5F0',
  card:        '#FFFFFF',
  surface:     '#EEEBE4',
  surfaceDeep: '#E4E0D8',

  // Borders
  cardBorder:  'rgba(0,0,0,0.06)',
  separator:   'rgba(0,0,0,0.08)',

  // Text
  text:        '#1A1814',
  textSub:     '#6B6760',
  textMuted:   '#A09C96',

  // Accent (warm amber — fits a café brand)
  accent:      '#C8832A',
  accentSoft:  'rgba(200,131,42,0.12)',
  accentLight: '#FFF3E0',

  // Interactive elements
  pill:        '#1A1814',
  pillText:    '#FFFFFF',

  // Input / form
  inputBg:     '#FFFFFF',
  inputBorder: '#D8D4CC',
  placeholder: '#B0ABA4',

  // Status bar
  statusBar:   'dark-content',

  // Shadows (spread as props)
  shadow: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius:  12,
    elevation:     6,
  },
};

export const DARK_THEME = {
  isDark: true,

  bg:          '#0F0E0C',
  card:        '#1C1B18',
  surface:     '#252420',
  surfaceDeep: '#1A1916',

  cardBorder:  'rgba(255,255,255,0.07)',
  separator:   'rgba(255,255,255,0.07)',

  text:        '#F0EDE8',
  textSub:     '#9A9590',
  textMuted:   '#5A5752',

  accent:      '#E8A040',
  accentSoft:  'rgba(232,160,64,0.12)',
  accentLight: '#2A1E0A',

  pill:        '#F0EDE8',
  pillText:    '#0F0E0C',

  inputBg:     '#1C1B18',
  inputBorder: '#3A3830',
  placeholder: '#5A5752',

  statusBar:   'light-content',

  shadow: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius:  12,
    elevation:     8,
  },
};

// ── Context ───────────────────────────────────────────────────────────────────
const ThemeContext = createContext({
  theme:       LIGHT_THEME,
  isDark:      false,
  toggleTheme: () => {},
});

// ── Provider — wrap your root App component with this ─────────────────────────
export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);
  const [isThemeLoaded, setIsThemeLoaded] = useState(false); // ADD THIS

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(saved => {
      if (saved === 'dark') setIsDark(true);
      setIsThemeLoaded(true); // ADD THIS — mark as ready after loading
    });
  }, []);

  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    await AsyncStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
  };

  const theme = isDark ? DARK_THEME : LIGHT_THEME;

  // Don't render anything until theme is resolved
  if (!isThemeLoaded) return null; // ADD THIS

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useTheme() {
  return useContext(ThemeContext);
}

// ── HOC for class components ──────────────────────────────────────────────────
// Class components can't use hooks directly.
// Wrap them:  export default withTheme(MyClassComponent)
// Then access via:  this.props.theme, this.props.isDark, this.props.toggleTheme
export function withTheme(Component) {
  return function ThemedComponent(props) {
    const themeProps = useTheme();
    return <Component {...props} {...themeProps} />;
  };
}