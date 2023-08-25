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
       * @default "nodejs"
       * @example "custom-nodejs"
       */
      nodeDir?: string;

      /**
       * Startup mode of the Node.js engine.
       *
       * @since 1.0.0
       * @default "auto"
       * @example "manual"
       */
      startMode?: StartMode;
    };
  }
}

/**
 * A string that represents the Node.js engine startup mode.
 *
 * The following values are accepted:
 * - `auto`: The Node.js engine starts automatically when the application is launched.
 * - `manual`: The Node.js engine is started via the `NodeJS.start()` method.
 */
export type StartMode = 'auto' | 'manual';

/**
 * An interface containing the options used when starting the Node.js engine manually.
 */
export interface StartOptions {
  /**
   * Relative path of the integrated Node.js project based on the Capacitor webdir.
   *
   * Defaults to the `nodeDir` field of the global plugin configuration. If the `nodeDir` config
   * is not set, `nodejs` in the Capacitor webdir is used as Node.js project directory.
   *
   * @since 1.0.0
   */
  nodeDir?: string;

  /**
   * The primary entry point to the Node.js program.
   * This should be a module relative to the root of your Node.js project folder.
   *
   * Defaults to the `main` field in the project's package.json. If the `main` field
   * is not set, `index.js` in the project's root folder is used.
   *
   * @since 1.0.0
   */
  script?: string;

  /**
   * A list of string arguments.
   *
   * @since 1.0.0
   */
  args?: string[];

  /**
   * Environment key-value pairs.
   *
   * @since 1.0.0
   */
  env?: NodeEnv;
}

/**
 * An interface that holds environment variables as string key-value pairs.
 */
export interface NodeEnv {
  [key: string]: string | undefined;
}

/**
 * The payload data to send a message to the web page via `eventName`,
 * along with arguments. Arguments will be serialized with JSON.
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
 */
export type ChannelListenerCallback = (data: ChannelCallbackData) => void;

/**
 * The callback data object when a message from the Node.js process arrives.
 */
export interface ChannelCallbackData {
  /**
   * The received array of arguments.
   *
   * @since 1.0.0
   */
  args: any[];
}
