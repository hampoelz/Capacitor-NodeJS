export interface NativeBridge {
  emit: (args: NativeBridgePayloadData) => void;
  registerChannel: (
    channelName: string,
    callback: NativeBridgeCallback
  ) => void;
}

export interface NativeBridgePayloadData {
  channelName: string;
  channelMessage: string;
}

export type NativeBridgeCallback = (args: NativeBridgePayloadData) => void;

export interface NativeBridgeChannelMessageData {
  eventName: string;
  eventMessage: string;
}

export type Platform = NodeJS.Platform | 'android' | 'ios';
