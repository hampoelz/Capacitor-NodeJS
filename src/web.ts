import { WebPlugin } from '@capacitor/core';

import type { NodeJSPlugin } from './definitions';

export class NodeJSWeb extends WebPlugin implements NodeJSPlugin {
  send(): Promise<{ value: boolean }> {
    throw this.unavailable('NodeJs Engine not available in browser.');
  }
}
