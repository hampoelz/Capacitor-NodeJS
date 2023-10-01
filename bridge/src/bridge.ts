import { EventEmitter } from 'events';
import process from 'process';

import type { NativeBridge, NativeBridgePayloadData, NativeBridgeCallback, Platform } from './definitions';
import { ChannelMessageCodec } from './utils';

class NativeMobileBridge implements NativeBridge {
  private mobileBridge = (process as any)._linkedBinding('nativeBridge');

  emit(args: NativeBridgePayloadData): void {
    this.mobileBridge.emit(args.channelName, args.channelMessage);
  }

  registerChannel(channelName: string, callback: NativeBridgeCallback): void {
    this.mobileBridge.registerChannel(channelName, (channelName: string, channelMessage: string) => {
      callback({ channelName, channelMessage });
    });
  }
}

class NativeDesktopBridge implements NativeBridge {
  emit(args: NativeBridgePayloadData): void {
    if (!process.send) {
      throw new Error('No IPC channel has been established between the Node.js process and the Capacitor layer.');
    }

    process.send(args);
  }

  registerChannel(channelName: string, callback: NativeBridgeCallback): void {
    process.on('message', (args: NativeBridgePayloadData) => {
      if (args.channelName === channelName) {
        callback(args);
      }
    });
  }
}

const platform = process.platform as Platform;
const isMobilePlatform = platform === 'android' || platform === 'ios';

const nativeBridge: NativeBridge = isMobilePlatform ? new NativeMobileBridge() : new NativeDesktopBridge();

class Channel extends EventEmitter {
  private channelName: string;

  constructor(channelName: string) {
    super();
    this.channelName = channelName;

    const self = this;
    nativeBridge.registerChannel(channelName, (args) => {
      const channelMessage = args.channelMessage;
      const payload = ChannelMessageCodec.deserialize(channelMessage);
      self.emitWrapper(payload.eventName, ...payload.args);
    });
  }

  /**
   * Sends a message to the Capacitor layer via eventName, along with arguments.
   * Arguments will be serialized with JSON.
   *
   * @param eventName The name of the event being send to.
   * @param args The Array of arguments to send.
   */
  send(eventName: string, ...args: any[]) {
    if (eventName === undefined || eventName === '') {
      throw new Error("Required parameter 'eventName' was not specified");
    }

    const payload = { eventName, args };

    const channelName = this.channelName;
    const channelMessage = ChannelMessageCodec.serialize(payload);

    const channelPayload = {
      channelName,
      channelMessage,
    };

    nativeBridge.emit(channelPayload);
  }

  emitWrapper(eventName: string, ...args: any[]) {
    const self = this;
    setImmediate(() => {
      self.emit(eventName, ...args);
    });
  }

  /**
   * Listens to `eventName` and calls `listener(args...)` when a new message arrives from the Capacitor layer.
   */
  override on(eventName: string, listener: (...args: any[]) => void): this {
    return super.on(eventName, listener);
  }

  /**
   * Listens one time to `eventName` and calls `listener(args...)` when a new message
   * arrives from the Capacitor layer, after which it is removed.
   */
  override once(eventName: string, listener: (...args: any[]) => void): this {
    return super.once(eventName, listener);
  }

  /**
   * Alias for `channel.on(eventName, listener)`.
   */
  override addListener(eventName: string, listener: (...args: any[]) => void): this {
    return super.addListener(eventName, listener);
  }

  /**
   * Removes the specified `listener` from the listener array for the specified `eventName`.
   */
  override removeListener(eventName: string, listener: (...args: any[]) => void): this {
    return super.removeListener(eventName, listener);
  }

  /**
   * Removes all listeners, or those of the specified `eventName`.
   *
   * @param eventName The name of the event all listeners will be removed from.
   */
  override removeAllListeners(eventName?: string): this {
    return super.removeAllListeners(eventName);
  }
}

const appChannel = new Channel('APP_CHANNEL');

/**
 * Provides a few methods to send messages from the Node.js process to the Capacitor layer,
 * and to receive replies from the Capacitor layer.
 */
const eventChannel = new Channel('EVENT_CHANNEL');

/**
 * Emitted when the application gains focus.
 */
function onResume(listener: () => void): void {
  appChannel.on('resume', listener);
}

/**
 * Emitted when the application loses focus.
 */
function onPause(listener: () => void): void {
  appChannel.on('pause', listener);
}

/**
 * Returns a path for a per-user application data directory on each platform,
 * where data can be read and written.
 */
function getDataPath(): string {
  const path = process.env['DATADIR'];
  if (!path) {
    throw new Error('Unable to get a directory for persistent data storage.');
  }
  return path;
}

export { ChannelMessageCodec, appChannel, eventChannel, onResume, onPause, getDataPath };
