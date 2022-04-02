import { app } from 'electron';
import { EventEmitter } from 'events';
import { existsSync, readFile, writeFile } from 'fs';
import { join, relative, sep, resolve, dirname } from 'path';

import type { MessageOptions } from '../../src/definitions';
import { NativeBridge, MessageCodec, eventChannel } from '../assets/builtin_modules/bridge/bridge';

export class NodeJS extends EventEmitter {

    isNodeEngineRunning = false;

    constructor() {
        super();
        
        if (!app) return;

        //
        // Forward event emits from the NodeJS engine to CapacitorJS
        //
        NativeBridge.addListener('APP_CHANNEL', data => {
            const messageCodec = MessageCodec.deserialize(data);
            if (messageCodec.event == "ready") this.isNodeEngineRunning = true;
        });

        NativeBridge.addListener('EVENT_CHANNEL', data => {
            const messageCodec = MessageCodec.deserialize(data);
            this.emit(messageCodec.event, { args: messageCodec.payload });
        });

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
            const nodeDir = join(app.getAppPath(), 'app', options?.nodeDir ?? '');
            const nodePackageJson = join(nodeDir, 'package.json');
            import(nodePackageJson).then(async value => {
                const nodeMainFile = join(nodeDir, value.main);

                // link 'bridge' dependency to correct folder
                readFile(nodeMainFile, 'utf8', (error, data) => {
                    if (error) return; // TODO

                    const relativeFile = relative(dirname(nodeMainFile), resolve('node_modules/capacitor-nodejs/electron/assets/builtin_modules/bridge')).split(sep).join('/');
                    const result = data.replace(/(?<=(require\(|import(( .+?(?= from) from )|\(|\s))['|"|`])bridge(?=['|"|`])/g, relativeFile); // https://regex101.com/r/nwKu42

                    writeFile(nodeMainFile, result, 'utf8', error => {
                        if (error) return; // TODO
                        require(nodeMainFile);
                    });
                });
            });
        }
    }

    async send(options: MessageOptions): Promise<{ value: boolean; }> {
        if (!this.isNodeEngineRunning) return { value: false };
        eventChannel.emitWrapper(options.eventName, options.args);
        return { value: true };
    }
}