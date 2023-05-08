import { WebPlugin } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';

declare const CapacitorCustomPlatform: any;

export class NodeJSWeb extends WebPlugin {
  constructor() {
    super();

    // electron platform loads web implementation by default, but native implementation should be used
    if (
      typeof CapacitorCustomPlatform !== 'undefined' &&
      CapacitorCustomPlatform?.plugins?.NodeJS
    )
      return CapacitorCustomPlatform.plugins.NodeJS;
  }

  send(): Promise<{ value: boolean }> {
    throw this.unavailable(
      'The NodeJS engine is not available in the browser!',
    );
  }

  whenReady(): Promise<void> {
    throw this.unavailable(
      'The NodeJS engine is not available in the browser!',
    );
  }

  addListener(): Promise<PluginListenerHandle> & PluginListenerHandle {
    throw this.unavailable(
      'The NodeJS engine is not available in the browser!',
    );
  }
}
