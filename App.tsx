import React from 'react';
import { AppNavigator } from './src/navigation/AppNavigator';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import Toast from 'react-native-toast-message';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#007AFF',
    accent: '#4CAF50',
  },
};

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <AppNavigator />
      <Toast />
    </PaperProvider>
  );
}