import { WebPlugin } from '@capacitor/core';

export class NodeJSWeb extends WebPlugin {
  send(): Promise<{ value: boolean }> {
    throw this.unavailable('NodeJs Engine not available in browser.');
  }
}
