import { appChannel, eventChannel, getDataDir, platform } from './bridge';

appChannel.send("ready");

export { eventChannel as channel, getDataDir as datadir, platform };
