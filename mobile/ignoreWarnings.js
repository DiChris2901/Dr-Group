import { LogBox } from 'react-native';

// 1. Suprimir advertencias en la UI (YellowBox)
LogBox.ignoreLogs([
  'expo-notifications',
  'Expo Go',
  'Push notifications',
  'remote notifications',
  'functionality provided by expo-notifications'
]);

// 2. Suprimir errores y advertencias en la consola y RedBox
const originalWarn = console.warn;
const originalError = console.error;

const shouldSuppress = (...args) => {
  try {
    const msg = args.join(' ');
    return (
      (msg.includes('expo-notifications') || msg.includes('Expo Go')) &&
      (msg.includes('Push notifications') || msg.includes('remote notifications') || msg.includes('functionality provided by expo-notifications'))
    );
  } catch (e) {
    return false;
  }
};

console.warn = (...args) => {
  if (shouldSuppress(...args)) return;
  originalWarn.apply(console, args);
};

console.error = (...args) => {
  if (shouldSuppress(...args)) return;
  originalError.apply(console, args);
};
