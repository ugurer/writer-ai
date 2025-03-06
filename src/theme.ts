import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#3498db',
    secondary: '#2ecc71',
    error: '#e74c3c',
    background: '#f5f5f5',
    surface: '#ffffff',
    surfaceVariant: '#f8f9fa',
    onSurface: '#000000',
    onSurfaceVariant: 'rgba(0,0,0,0.7)',
    outline: 'rgba(0,0,0,0.1)',
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#3498db',
    secondary: '#2ecc71',
    error: '#e74c3c',
    background: '#121212',
    surface: '#1e1e1e',
    surfaceVariant: '#2d2d2d',
    onSurface: '#ffffff',
    onSurfaceVariant: 'rgba(255,255,255,0.7)',
    outline: 'rgba(255,255,255,0.1)',
  },
}; 