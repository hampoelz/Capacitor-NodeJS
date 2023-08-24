import type { ChildProcess, ForkOptions } from 'child_process';
import { fork } from 'child_process';
import { app } from 'electron';
import { existsSync } from 'fs';
import { join as joinPath } from 'path';

import type { NativeBridgePayloadData } from '../../bridge/src/definitions';
import { ChannelMessageCodec } from '../../bridge/src/utils';
import type { ChannelPayloadData, NodeEnv } from '../../src/definitions';

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

    public async startEngine(projectDir: string, mainFile?: string, args?: string[], env?: NodeEnv): Promise<void> {
        if (this.engineStatus.isStarted()) {
            throw new Error('The Node.js engine has already been started.');
        }
        this.engineStatus.setStarted();

        const projectPath = joinPath(app.getAppPath(), 'app', projectDir);
        const modulesPath = joinPath(__dirname, '..', 'assets', 'builtin_modules')
        const dataPath = app.getPath('userData');

        if (!existsSync(projectPath)) {
            throw new Error("Unable to access the Node.js project. (No such directory)");
        }

        const projectPackageJsonPath = joinPath(projectPath, "package.json");
        
        let projectMainFile = "index.js";
        if (mainFile) {
            projectMainFile = mainFile;
        } else if (existsSync(projectPackageJsonPath)) {
            try {
                const projectPackageJson = await import(projectPackageJsonPath);
                const projectPackageJsonMainFile = projectPackageJson.main;

                if (projectPackageJsonMainFile) {
                    projectMainFile = projectPackageJson.main;
                }
            } catch {
                throw new Error("Failed to read the package.json file of the Node.js project.");
            }
        }

        const projectMainPath = joinPath(projectPath, projectMainFile);

        if (!existsSync(projectMainPath)) {
            throw new Error("Unable to access main script of the Node.js project. (No such file)");
        }

        const modulesPaths = joinEnv(projectPath, modulesPath);

        const nodeEnv = {
            "NODE_PATH": modulesPaths,
            "DATADIR": dataPath,
            ...env
        }

        const nodeOptions: ForkOptions = {
            env: nodeEnv,
            serialization: 'json'
        };

        this.nodeProcess = fork(projectMainPath, args, nodeOptions);

        this.nodeProcess.on('message', (args: NativeBridgePayloadData) => {
            this.receiveMessage(args.channelName, args.channelMessage);
        });
    }

    public resolveWhenReady(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (!this.engineStatus.isStarted()) {
                reject('The Node.js engine has not been started yet.');
            }

            this.engineStatus.whenReady(() => resolve());
        });
    }

    public sendMessage(payload: ChannelPayloadData): void {
        if (!this.engineStatus.isStarted()) {
            throw new Error('The Node.js engine has not been started yet.');
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