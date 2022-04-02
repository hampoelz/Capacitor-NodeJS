const { eventChannel, appChannel } = require('./bridge');

appChannel.send('ready');

module.exports = exports = {
  channel: eventChannel
};