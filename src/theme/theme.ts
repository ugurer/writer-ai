import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

const baseColors = {
  primary: '#3498db',
  secondary: '#2ecc71',
  error: '#e74c3c',
  success: '#2ecc71',
  warning: '#f1c40f',
  info: '#3498db',
};

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...baseColors,
    background: '#f5f5f5',
    surface: '#ffffff',
    surfaceVariant: '#f8f9fa',
    surfaceDisabled: 'rgba(0,0,0,0.12)',
    onSurface: '#000000',
    onSurfaceVariant: 'rgba(0,0,0,0.7)',
    onSurfaceDisabled: 'rgba(0,0,0,0.38)',
    outline: 'rgba(0,0,0,0.12)',
    outlineVariant: 'rgba(0,0,0,0.06)',
    shadow: 'rgba(0,0,0,0.1)',
    scrim: 'rgba(0,0,0,0.3)',
    inverseSurface: '#2d2d2d',
    inverseOnSurface: '#ffffff',
    inversePrimary: '#8bc4ea',
    elevation: {
      level0: 'transparent',
      level1: '#ffffff',
      level2: '#f5f5f5',
      level3: '#eeeeee',
      level4: '#e0e0e0',
      level5: '#d6d6d6',
    },
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...baseColors,
    background: '#121212',
    surface: '#1e1e1e',
    surfaceVariant: '#2d2d2d',
    surfaceDisabled: 'rgba(255,255,255,0.12)',
    onSurface: '#ffffff',
    onSurfaceVariant: 'rgba(255,255,255,0.7)',
    onSurfaceDisabled: 'rgba(255,255,255,0.38)',
    outline: 'rgba(255,255,255,0.12)',
    outlineVariant: 'rgba(255,255,255,0.06)',
    shadow: 'rgba(0,0,0,0.3)',
    scrim: 'rgba(0,0,0,0.6)',
    inverseSurface: '#f5f5f5',
    inverseOnSurface: '#000000',
    inversePrimary: '#1a5a8a',
    elevation: {
      level0: 'transparent',
      level1: '#1e1e1e',
      level2: '#222222',
      level3: '#272727',
      level4: '#2c2c2c',
      level5: '#2d2d2d',
    },
  },
}; 