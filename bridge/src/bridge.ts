import { EventEmitter } from 'events';
import process from 'process';

import type { NativeBridge, NativeBridgePayloadData, NativeBridgeCallback, Platform } from './definitions';
import { ChannelMessageCodec } from './utils';

class NativeMobileBridge implements NativeBridge {
    private mobileBridge = (process as any)._linkedBinding('nativeBridge');

    emit(args: NativeBridgePayloadData): void {
        this.mobileBridge.emit(args.channelName, args.channelMessage);
    }

    registerChannel(channelName: string, callback: NativeBridgeCallback): void {
        this.mobileBridge.registerChannel(channelName, (channelName: string, channelMessage: string) => {
            callback({ channelName, channelMessage });
        });
    }
}

class NativeDesktopBridge implements NativeBridge {
    emit(args: NativeBridgePayloadData): void {
        if (!process.send) {
            throw new Error("No IPC channel has been established between the Node.js process and the Capacitor layer.");
        }
        
        process.send(args);
    }

    registerChannel(channelName: string, callback: NativeBridgeCallback): void {
        process.on('message', (args: NativeBridgePayloadData) => {
            if (args.channelName === channelName) {
                callback(args);
            }
        });
    }
}

const platform = process.platform as Platform;
const isMobilePlatform = platform === 'android' || platform === 'ios';

const nativeBridge: NativeBridge = isMobilePlatform ? new NativeMobileBridge() : new NativeDesktopBridge();

class Channel extends EventEmitter {
    private channelName: string;

    constructor(channelName: string) {
        super();
        this.channelName = channelName;

        const self = this;
        nativeBridge.registerChannel(channelName, args => {
            const channelMessage = args.channelMessage;
            const payload = ChannelMessageCodec.deserialize(channelMessage);
            self.emitWrapper(payload.eventName, ...payload.args);
        });
    }

    send(eventName: string, ...args: any[]) {
        if (eventName === undefined || eventName === "") {
            throw new Error("Required parameter 'eventName' was not specified");
        }

        const payload = { eventName, args };

        const channelName = this.channelName;
        const channelMessage = ChannelMessageCodec.serialize(payload);

        const channelPayload = {
            channelName,
            channelMessage
        };

        nativeBridge.emit(channelPayload);
    }

    emitWrapper(eventName: string, ...args: any[]) {
        const self = this;
        setImmediate(() => {
            self.emit(eventName, ...args);
        });
    }
}

const EventChannel = new Channel('EVENT_CHANNEL');
const AppChannel = new Channel('APP_CHANNEL');

export {
    ChannelMessageCodec,
    AppChannel,
    EventChannel,
    platform
}