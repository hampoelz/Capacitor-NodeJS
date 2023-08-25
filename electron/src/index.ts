import { app } from 'electron';
import { EventEmitter } from 'events';
import { existsSync } from 'fs';
import { join } from 'path';

import type {
  StartOptions,
  ChannelCallbackData,
  ChannelPayloadData
} from '../../src/definitions';

import { CapacitorNodeJSImplementation } from './implementation';

class PluginSettings {
  nodeDir = 'nodejs';
  startMode = 'auto';
}

export class CapacitorNodeJS extends EventEmitter {
  public static CHANNEL_NAME_APP = 'APP_CHANNEL';
  public static CHANNEL_NAME_EVENTS = 'EVENT_CHANNEL';

  //private config?: Record<string, any>;
  private implementation: CapacitorNodeJSImplementation;

  constructor(/*config?: Record<string, any>*/) {
    super();

    //this.config = config;
    this.implementation = new CapacitorNodeJSImplementation(this.PluginEventNotifier);

    this.readPluginSettings().then(pluginSettings => {
      if (pluginSettings.startMode === 'auto') {
        this.implementation.startEngine(pluginSettings.nodeDir);
      }
    });
  }

  private async readPluginSettings(): Promise<PluginSettings> {
    //!-------------------------- workaround ---------------------------
    // the configuration exposed by the capacitor-community/electron platform
    // is always empty for some reason
    const configPathBase = join(app.getAppPath(), 'capacitor.config.');
    const configPathExt =
      existsSync(configPathBase + 'json') ? 'json' :
        existsSync(configPathBase + 'js') ? 'js' :
          existsSync(configPathBase + 'ts') ? 'ts' : undefined;
    const configPath = configPathBase + configPathExt;
    const configFile = await require(configPath);
    const capacitorConfig = configFile.default || configFile;
    const config = capacitorConfig?.plugins?.CapacitorNodeJS;
    //!-----------------------------------------------------------------

    const settings = new PluginSettings();
    settings.nodeDir = config?.nodeDir || settings.nodeDir;
    settings.startMode = config?.startMode || settings.startMode;

    return settings;
  }

  //#region PluginMethods
  //---------------------------------------------------------------------------------------

  async start(args?: StartOptions): Promise<void> {
    const pluginSettings = await this.readPluginSettings();

    if (pluginSettings.startMode !== 'manual') {
      throw new Error('Manual startup of the Node.js engine is not enabled.');
    }

    const projectDir = args?.nodeDir ?? pluginSettings.nodeDir;
    const nodeMain = args?.script;
    const nodeArgs = args?.args;
    const nodeEnv = args?.env;

    this.implementation.startEngine(projectDir, nodeMain, nodeArgs, nodeEnv);
  }

  async send(args: ChannelPayloadData): Promise<void> {
    const eventName = args.eventName;
    if (eventName === undefined || eventName === '') {
      throw new Error("Required parameter 'eventName' was not specified");
    }

    if (args.args === undefined) {
      args.args = [];
    }

    this.implementation.sendMessage(args);
  }

  async whenReady(): Promise<void> {
    return this.implementation.resolveWhenReady();
  }

  // removeAllListeners() function is missing (https://github.com/capacitor-community/electron/pull/185)

  //---------------------------------------------------------------------------------------
  //#endregion

  //#region PluginEvents
  //---------------------------------------------------------------------------------------

  protected PluginEventNotifier = {

    // Bridge -------------------------------------------------------------------------------

    channelReceive: (eventName: string, payloadArray: any[]): void => {
      this.notifyChannelListeners(eventName, payloadArray);
    }
  };

  //---------------------------------------------------------------------------------------
  //#endregion

  //#region PluginListeners
  //---------------------------------------------------------------------------------------

  private notifyChannelListeners(eventName: string, payloadArray: any[]): void {
    const args: ChannelCallbackData = { args: payloadArray };
    this.emit(eventName, args);
  }

  //---------------------------------------------------------------------------------------
  //#endregion
}
