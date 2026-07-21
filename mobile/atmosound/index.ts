import { registerRootComponent } from 'expo';

console.log('[Rainland] index.ts loaded — JS bundle 已執行');

import App from './App';

console.log('[Rainland] App 元件已載入');

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
