const EventEmitter = require('events');
const NativeBridge = new EventEmitter();

class MessageCodec {
  constructor(_event, ..._payload) {
    this.event = _event;
    this.payload = JSON.stringify(_payload);
  }

  static serialize(event, ...payload) {
    const data = new MessageCodec(event, ...payload);
    return JSON.stringify(data);
  }

  static deserialize(data) {
    var messageCodec = JSON.parse(data);
    if (typeof messageCodec.payload !== 'undefined') {
      messageCodec.payload = JSON.parse(messageCodec.payload);
    }
    return messageCodec;
  }
}

class Channel extends EventEmitter {
  constructor(name) {
    super();
    this.name = name;
  }
  
  send(eventName, ...args) {
    var data = MessageCodec.serialize(eventName, ...args);
    console.log(data)
    NativeBridge.emit(this.name, data);
  }

  emitWrapper(event, ...args) {
    const self = this;
    setImmediate(() => self.emit(event, ...args));
  }
}

const eventChannel = new Channel('EVENT_CHANNEL');
const appChannel = new Channel('APP_CHANNEL');

module.exports = exports = {
  NativeBridge,
  MessageCodec,
  appChannel,
  eventChannel,
};