import type { PluginListenerHandle } from '@capacitor/core';
import { app } from 'electron';
import { existsSync } from 'fs';
import { join } from 'path';

import type {
    NodeJSPlugin,
    MessageOptions,
    ChannelListener
} from '../../src/definitions';
import { channel } from '../assets/builtin_modules/bridge/main';

export class NodeJS implements NodeJSPlugin {
    constructor() {
        if (!app) return;

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
            const nodeDir = join(app.getAppPath(), 'app', options?.nodeDir ?? '');
            const nodePackageJson = join(nodeDir, 'package.json');
            import(nodePackageJson).then(value => {
                const nodeMainFile = join(nodeDir, value.main);
                require(nodeMainFile);
            });
        }
    }

    async send(options: MessageOptions): Promise<{ value: boolean; }> {
        channel.emitWrapper(options.eventName, options.args);
        return { value: true };
    }

    addListener(eventName: string, listenerFunc: ChannelListener): Promise<PluginListenerHandle> & PluginListenerHandle {
        listenerFunc({ args: [eventName] });
        throw new Error('Method not implemented.');
    }

    removeAllListeners(): Promise<void> {
        throw new Error('Method not implemented.');
    }
}