import type { PluginListenerHandle } from '@capacitor/core';
import { Capacitor } from '@capacitor/core';

import type {
    ChannelPayloadData,
    ChannelCallbackData,
    ChannelListenerCallback,
    StartOptions
} from './definitions';
import { CapacitorNodeJS } from './implementation';

export interface NodeJSInterface {
  /**
   * Starts the Node.js engine with properties as set by the `options`.
   *
   * @since 1.0.0
   */
  start(options?: StartOptions): Promise<void>;

  /**
   * Sends a message to the Node.js process.
   *
   * @since 1.0.0
   */
  send(args: ChannelPayloadData): Promise<void>;

  /**
   * Resolves when the Node.js process is initialized.
   *
   * @since 1.0.0
   */
  whenReady(): Promise<void>;

  /**
   * Listens to `eventName` and calls `listenerFunc(data)` when a new message arrives from the Node.js process.
   *
   * **Note:** When using the Electron platform, [`PluginListenerHandle.remove()`](#pluginlistenerhandle) does not work due to limitations.
   * Use [`removeListener(listenerFunc)`](#removelistener) instead.
   *
   * @since 1.0.0
   */
  addListener(
    eventName: string,
    listenerFunc: ChannelListenerCallback
  ): Promise<PluginListenerHandle> & PluginListenerHandle;

  /**
   * Removes the specified `listenerHandle` from the listener array for the event it refers to.
   *
   * @since 1.0.0
   */
  removeListener(listenerHandle: PluginListenerHandle): Promise<void>;

  /**
   * Removes all listeners, or those of the specified `eventName`, for this plugin.
   *
   * @since 1.0.0
   */
  removeAllListeners(eventName?: string): Promise<void>;
}

class NodeJSPlugin implements NodeJSInterface {
  private readonly listenerList: {
    eventName: string;
    listenerHandle: Promise<PluginListenerHandle> & PluginListenerHandle;
  }[] = [];

  start(args?: StartOptions): Promise<void> {
    return CapacitorNodeJS.start(args);
  }

  send(args: ChannelPayloadData): Promise<void> {
    return CapacitorNodeJS.send(args);
  }

  whenReady(): Promise<void> {
    return CapacitorNodeJS.whenReady();
  }

  addListener(
    eventName: string,
    listenerFunc: ChannelListenerCallback
  ): Promise<PluginListenerHandle> & PluginListenerHandle;

  addListener(eventName: any, listenerFunc: ChannelListenerCallback): Promise<PluginListenerHandle> & PluginListenerHandle {
    const listenerHandle = CapacitorNodeJS.addListener(eventName, (data: ChannelCallbackData) => {
      listenerFunc(data);
    });

    this.listenerList.push({ eventName, listenerHandle });
    return listenerHandle;
  }

  async removeListener(listenerHandle: PluginListenerHandle): Promise<void> {
    if (Capacitor.getPlatform() === 'electron') {
      await (CapacitorNodeJS as any).removeListener(listenerHandle);
    } else {
      await listenerHandle.remove();
    }

    for (let index = 0; index < this.listenerList.length; index++) {
      const listener = this.listenerList[index];

      if (listenerHandle === (await listener.listenerHandle)) {
        this.listenerList.splice(index, 1);
        break;
      }
    }
  }

  async removeAllListeners(eventName?: string): Promise<void> {
    for (const listener of [...this.listenerList]) {
      if (!eventName || eventName === listener.eventName) {
        const listenerHandle = await listener.listenerHandle;
        await this.removeListener(listenerHandle);
      }
    }
  }
}

const NodeJS = new NodeJSPlugin();

export { NodeJS };
