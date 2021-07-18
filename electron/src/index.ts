import { PluginListenerHandle } from '@capacitor/core';
import type {
    NodeJSPlugin,
    MessageOptions,
    ChannelListener,
} from '../../src/definitions';

export class NodeJS implements NodeJSPlugin {
    send(options: MessageOptions): Promise<{ value: boolean; }> {
        throw new Error('Send method not implemented yet! MessageOptions: "' + options + '"');
    }
    addListener(eventName: string, listenerFunc: ChannelListener): Promise<PluginListenerHandle> & PluginListenerHandle {
        throw new Error('Listener method not implemented yet! EventName: "' + eventName + '", ChannelListener: "' + listenerFunc + '"');
    }
    
}