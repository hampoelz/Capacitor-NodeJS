import type { ChannelPayloadData as EventPayloadData } from '../../src/definitions';

import type { NativeBridgeChannelMessageData } from './definitions';

export class ChannelMessageCodec {
  static serialize(payload: EventPayloadData): string {
    const eventName = payload.eventName;
    const args = payload.args;

    const eventMessage = JSON.stringify(args);

    const data: NativeBridgeChannelMessageData = {
      eventName,
      eventMessage
    };

    const channelMessage = JSON.stringify(data);
    return channelMessage;
  }

  static deserialize(channelMessage: string): EventPayloadData {
    const data: NativeBridgeChannelMessageData = JSON.parse(channelMessage);

    const eventName = data.eventName;
    const eventMessage = data.eventMessage;

    let args = [];
    if (eventMessage) {
      args = JSON.parse(eventMessage);
    }

    const payload = {
      eventName,
      args
    };

    return payload;
  }
}
