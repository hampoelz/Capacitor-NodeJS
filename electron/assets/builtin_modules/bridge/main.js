const { EventEmitter } = require('events');

// class MessageCodec {
//   constructor(_event, ..._payload) {
//     this.event = _event;
//     this.payload = JSON.stringify(_payload);
//   }

//   static serialize(event, ...payload) {
//     const data = new MessageCodec(event, ...payload);
//     return JSON.stringify(data);
//   }

//   static deserialize(data) {
//     var messageCodec = JSON.parse(data);
//     if (typeof messageCodec.payload !== 'undefined') {
//       messageCodec.payload = JSON.parse(messageCodec.payload);
//     }
//     return messageCodec;
//   }
// }

class Channel extends EventEmitter {
  constructor() {
    super();
    this.nativeBridge = new EventEmitter();
  }
  
  send(eventName, ...args) {
    this.nativeBridge.emit(eventName, ...args);
  }

  emitWrapper(event, ...args) {
    const self = this;
    setImmediate(() => self.emit(event, ...args));
  }
}

const eventChannel = new Channel();
//const appChannel = new Channel('APP_CHANNEL');

//appChannel.send('ready');


module.exports = exports = {
  channel: eventChannel
};
