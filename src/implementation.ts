import type { PluginListenerHandle } from '@capacitor/core';
import { registerPlugin } from '@capacitor/core';

import type { ChannelPayloadData, ChannelListenerCallback, StartOptions } from './definitions';

export interface CapacitorNodeJSPlugin {
  start(args?: StartOptions): Promise<void>;
  send(args: ChannelPayloadData): Promise<void>;
  whenReady(): Promise<void>;

  addListener(
    eventName: string,
    listenerFunc: ChannelListenerCallback,
  ): Promise<PluginListenerHandle>;
}

const CapacitorNodeJS = registerPlugin<CapacitorNodeJSPlugin>('CapacitorNodeJS', {
  web: () => import('./web').then((m) => new m.CapacitorNodeJSWeb()),
  electron: () => (window as any).CapacitorCustomPlatform.plugins.CapacitorNodeJS,
});

export { CapacitorNodeJS };
