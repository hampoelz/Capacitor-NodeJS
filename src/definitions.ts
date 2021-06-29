/// <reference types="@capacitor/cli" />

import type { PluginListenerHandle } from "@capacitor/core";

declare module '@capacitor/cli' {
  export interface PluginsConfig {
    /**
     * These config values are available:
     */
    NodeJS?: {
      /**
       * Relative path of the integrated NodeJS project based on the capacitor webdir.
       *
       * @since 1.0.0
       * @default .
       * @example nodejs
       */
      nodeDir?: string;
    };
  }
}

export interface NodeJSPlugin {

  /**
   * Send a message to the NodeJS process.
   * 
   * @since 1.0.0
   */
  send(options: MessageOptions): Promise<{ value: boolean }>;

  /**
   * Listens to `eventName`, when a new message arrives `listenerFunc` from the NodeJS process would be called with `listenerFunc(event)`.
   * 
   * @since 1.0.0
   */
  addListener(
    eventName: string,
    listenerFunc: ChannelListener
  ): Promise<PluginListenerHandle> & PluginListenerHandle;

}

/**
 * Options to send a message to the NodeJS process via `eventName`, along with
 * arguments. Arguments will be serialized with JSON.
 * 
 * @since 1.0.0
 */
export interface MessageOptions {

  /**
   * The name of the event being send to
   * 
   * @since 1.0.0
   */
  eventName: string;

  /**
   * Array of arguments to send
   * 
   * @since 1.0.0
   */
  args: any[];

}

/**
 * The callback function when listen to messages from the NodeJS process.
 * 
 * @since 1.0.0
 */
export type ChannelListener = (event: ChannelListenerEvent) => void;


/**
 * The event object when a message from the NodeJS process arrives.
 * 
 * @since 1.0.0
 */
export interface ChannelListenerEvent {

  /**
   * Received array of arguments
   * 
   * @since 1.0.0
   */
  args: any[];

}