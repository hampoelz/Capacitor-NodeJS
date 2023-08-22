import { AppChannel, EventChannel, platform } from './bridge';

AppChannel.send("ready");

export { EventChannel as channel, platform };
