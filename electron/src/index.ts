import type { PluginListenerHandle } from '@capacitor/core';
import { app } from 'electron';
import { existsSync } from 'fs';
import { join } from 'path';

import type {
    NodeJSPlugin,
    MessageOptions,
    ChannelListener,
} from '../../src/definitions';

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

    send(options: MessageOptions): Promise<{ value: boolean; }> {
        throw new Error('Send method not implemented yet! MessageOptions: "' + options + '"');
    }
    addListener(eventName: string, listenerFunc: ChannelListener): Promise<PluginListenerHandle> & PluginListenerHandle {
        throw new Error('Listener method not implemented yet! EventName: "' + eventName + '", ChannelListener: "' + listenerFunc + '"');
    }

}