import { registerRootComponent } from 'expo';
import { setupBackgroundHandler } from './hooks/notification/useNotifee';

import App from './App';

// Register Notifee background event handler
// This MUST be called at the app root level before registerRootComponent
setupBackgroundHandler();

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
