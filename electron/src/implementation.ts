import type { ChildProcess, ForkOptions } from 'child_process';
import { fork } from 'child_process';
import { app } from 'electron';
import { join as joinPath } from 'path';

import type { NativeBridgePayloadData } from '../../bridge/src/definitions';
import { ChannelMessageCodec } from '../../bridge/src/utils';
import type { ChannelPayloadData } from '../../src/definitions';

import { CapacitorNodeJS } from "./index";
import { joinEnv } from './utils';

class EngineStatus {
    private whenEngineReadyListeners: (() => void)[] = [];
    private isEngineStarted = false;
    private isEngineReady = false;

    public setStarted(): void {
        this.isEngineStarted = true;
    }

    public isStarted(): boolean {
        return this.isEngineStarted;
    }

    public setReady(): void {
        this.isEngineReady = true;

        while (this.whenEngineReadyListeners.length > 0) {
            const whenEngineReadyListener = this.whenEngineReadyListeners[0];
            whenEngineReadyListener();
            this.whenEngineReadyListeners.splice(0, 1);
        }
    }

    public isReady(): boolean {
        return this.isEngineReady;
    }

    public whenReady(callback: () => void): void {
        if (this.isReady()) {
            callback();
        } else {
            this.whenEngineReadyListeners.push(callback);
        }
    }
}

export class CapacitorNodeJSImplementation {
    private nodeProcess?: ChildProcess;
    private eventNotifier: CapacitorNodeJS['PluginEventNotifier'];
    private engineStatus = new EngineStatus();

    constructor(eventNotifier: CapacitorNodeJS['PluginEventNotifier']) {
        this.eventNotifier = eventNotifier;
    }

    public async startEngine(projectDir: string): Promise<void> {
        if (this.engineStatus.isStarted()) {
            throw new Error('The Node.js engine has already been started.');
        }
        this.engineStatus.setStarted();

        const projectPath = joinPath(app.getAppPath(), 'app', projectDir);
        const modulesPath = joinPath(__dirname, '..', 'assets', 'builtin_modules')
        const dataPath = app.getPath('appData');

        const projectPackageJsonPath = joinPath(projectPath, "package.json");
        const projectPackageJson = await import(projectPackageJsonPath);

        const projectMainFile = projectPackageJson.main;
        const projectMainPath = joinPath(projectPath, projectMainFile);

        const modulesPaths = joinEnv(projectPath, modulesPath);

        const nodeParameters: string[] = [];
        const nodeOptions: ForkOptions = {
            env: {
                "NODE_PATH": modulesPaths,
                "DATADIR": dataPath
            },
            serialization: 'json'
        };

        this.nodeProcess = fork(projectMainPath, nodeParameters, nodeOptions);

        this.nodeProcess.on('message', (args: NativeBridgePayloadData) => {
            this.receiveMessage(args.channelName, args.channelMessage);
        });
    }

    public resolveWhenReady(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (!this.engineStatus.isStarted()) {
                reject('The Node.js engine has not been started.');
            }

            this.engineStatus.whenReady(() => resolve());
        });
    }

    public sendMessage(payload: ChannelPayloadData): void {
        if (!this.engineStatus.isStarted()) {
            throw new Error('The Node.js engine has not been started.');
        }

        if (!this.engineStatus.isReady()) {
            throw new Error('The Node.js engine is not ready yet.');
        }

        if (this.nodeProcess === undefined || !payload.eventName || !payload.args) return;

        const channelName = CapacitorNodeJS.CHANNEL_NAME_EVENTS;
        const channelMessage = ChannelMessageCodec.serialize(payload);

        const channelData: NativeBridgePayloadData = {
            channelName,
            channelMessage
        }

        this.nodeProcess.send(channelData);
    }

    private receiveMessage(channelName: string, channelMessage: string): void {
        const payload = ChannelMessageCodec.deserialize(channelMessage);

        const eventName = payload.eventName;
        const args = payload.args;

        if (channelName === CapacitorNodeJS.CHANNEL_NAME_APP && eventName === "ready") {
            this.engineStatus.setReady();
        } else if (channelName === CapacitorNodeJS.CHANNEL_NAME_EVENTS) {
            this.eventNotifier.channelReceive(eventName, args);
        }
    }
}