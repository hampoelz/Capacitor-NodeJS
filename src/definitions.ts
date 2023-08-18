/// <reference types="@capacitor/cli" />

declare module '@capacitor/cli' {
  export interface PluginsConfig {
    /**
     * These config values are available:
     */
    CapacitorNodeJS?: {
      /**
       * Relative path of the integrated Node.js project based on the Capacitor webdir.
       *
       * @since 1.0.0
       * @default nodejs
       * @example custom-nodejs
       */
      nodeDir?: string;
    };
  }
}

/**
 * The payload data to send a message to the web page via `eventName`,
 * along with arguments. Arguments will be serialized with JSON.
 *
 * @since 1.0.0
 */
export interface ChannelPayloadData {
  /**
   * The name of the event being send to.
   *
   * @since 1.0.0
   */
  eventName: string;

  /**
   * The array of arguments to send.
   *
   * @since 1.0.0
   */
  args: any[];
}

/**
 * The callback function to be called when listen to messages from the Node.js process.
 *
 * @since 1.0.0
 */
export type ChannelListenerCallback = (data: ChannelCallbackData) => void;

/**
 * The callback data object when a message from the Node.js process arrives.
 *
 * @since 1.0.0
 */
export interface ChannelCallbackData {
  /**
   * The received array of arguments.
   *
   * @since 1.0.0
   */
  args: any[];
}
