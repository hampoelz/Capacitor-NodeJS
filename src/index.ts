import { registerPlugin } from '@capacitor/core';

import type { NodeJSPlugin } from './definitions';

const NodeJS = registerPlugin<NodeJSPlugin>('NodeJS', {
  web: () => import('./web').then(m => new m.NodeJSWeb()),
});

export * from './definitions';
export { NodeJS };
