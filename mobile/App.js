import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </ThemeProvider>
    </AuthProvider>
  );
}
