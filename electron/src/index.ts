import { app } from 'electron';
import { EventEmitter } from 'events';
import { existsSync } from 'fs';
import { join } from 'path';

import type { Channel } from '../../assets/builtin_modules/bridge/bridge';
import type { ChannelPayloadData } from '../../src/definitions';

export class CapacitorNodeJS extends EventEmitter {
  private isNodeEngineRunning = false;
  private eventChannel: Channel = undefined;

  constructor() {
    super();

    if (!app) return;

    const _self = this;

    //
    // Get configurations and start NodeJS engine
    //
    const configFileBase = join(app.getAppPath(), 'capacitor.config.');
        const configFileExt =
            existsSync(configFileBase + 'json') ? 'json' :
                existsSync(configFileBase + 'js') ? 'js' :
                    existsSync(configFileBase + 'ts') ? 'ts' : undefined;

    if (!configFileExt) startEngine();

    const configFile = configFileBase + configFileExt;
    import(configFile).then(value => {
      const config = value.default || value;
      startEngine({ nodeDir: config?.plugins?.NodeJS?.nodeDir });
    });

    function startEngine(options: { nodeDir: string } = undefined): void {
      const nodeDir = join(app.getAppPath(), 'app', options?.nodeDir ?? 'nodejs');
      const nodePackageJson = join(nodeDir, 'package.json');
      const bridgeModule = join(nodeDir, 'node_modules', 'bridge', 'bridge');

      import(bridgeModule).then(bridge => {
        _self.eventChannel = bridge.eventChannel;

        //
        // Forward event emits from the NodeJS engine to CapacitorJS
        //
        bridge.NativeBridge.addListener('APP_CHANNEL', (data: any) => {
          const messageCodec = bridge.MessageCodec.deserialize(data);
          if (messageCodec.event == 'ready') _self.isNodeEngineRunning = true;
        });

        bridge.NativeBridge.addListener('EVENT_CHANNEL', (data: any) => {
          const messageCodec = bridge.MessageCodec.deserialize(data);
          _self.emit(messageCodec.event, { args: messageCodec.payload });
        });

        //
        // Start NodeJS project from app
        //
        import(nodePackageJson).then(value => {
          const nodeMainFile = join(nodeDir, value.main);
          require(nodeMainFile);
        });
      });
    }
  }

  async send(args: ChannelPayloadData): Promise<{ value: boolean }> {
    if (!this.isNodeEngineRunning || !this.eventChannel)
      return { value: false };
    this.eventChannel.emitWrapper(args.eventName, args.args);
    return { value: true };
  }

  async whenReady(): Promise<void> {
    return new Promise(resolve => {
      const timer = setTimeout(() => {
        if (this.isNodeEngineRunning && this.eventChannel) {
          resolve();
          clearInterval(timer);
        }
      }, 50);
    });
  }

  // removeAllListeners() function is missing (https://github.com/capacitor-community/electron/pull/185)
}
