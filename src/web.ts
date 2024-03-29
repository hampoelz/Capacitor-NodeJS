import { WebPlugin } from '@capacitor/core';
import type { CapacitorException } from '@capacitor/core';

import type { CapacitorNodeJSPlugin } from './implementation';

export class CapacitorNodeJSWeb extends WebPlugin implements CapacitorNodeJSPlugin {
  protected unavailableNodeJS(): CapacitorException {
    return this.unavailable('The NodeJS engine is not available in the browser!');
  }

  start(): Promise<void> {
    throw this.unavailableNodeJS();
  }

  send(): Promise<void> {
    throw this.unavailableNodeJS();
  }

  whenReady(): Promise<void> {
    throw this.unavailableNodeJS();
  }
}
