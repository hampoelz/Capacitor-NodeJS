import { appChannel, eventChannel, getDataPath } from './bridge';

appChannel.send('ready');

export { eventChannel as channel, getDataPath };
