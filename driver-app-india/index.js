/**
 * @format
 */

import 'react-native-gesture-handler';
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import {LogBox} from 'react-native';
import {initializeAuthListener} from './services/authInitializer';
import './utils/ignoreWarnings';

// Suppress the warning in the UI
LogBox.ignoreLogs([
  '[Reanimated] Reading from `value` during component render.', // Suppress specific warning
]);

// Override console.warn to exclude the Reanimated warning
const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  if (
    args[0] &&
    args[0].includes(
      '[Reanimated] Reading from `value` during component render',
    )
  ) {
    return; // Suppress this specific warning
  }
  originalConsoleWarn(...args); // Keep other warnings
};

initializeAuthListener();

AppRegistry.registerComponent(appName, () => App);
