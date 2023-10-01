import { appChannel, eventChannel, onResume, onPause, getDataPath } from './bridge';

appChannel.send('ready');

export { eventChannel as channel, onResume, onPause, getDataPath };
