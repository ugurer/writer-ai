import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { darkTheme, lightTheme } from './src/theme/theme';
import RootNavigator from './src/navigation/RootNavigator';
import { useStore } from './src/store';

const AppContent = () => {
  const { darkMode } = useStore();
  return (
    <PaperProvider theme={darkMode ? darkTheme : lightTheme}>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </PaperProvider>
  );
};

export default function App() {
  return <AppContent />;
}
