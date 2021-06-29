const NativeBridge = process._linkedBinding('nativeBridge');
const EventEmitter = require('events');

class MessageCodec {
    constructor(_event, ..._payload) {
        this.event = _event;
        this.payload = JSON.stringify(_payload);
    };

    static serialize(event, ...payload) {
        const data = new MessageCodec(event, ...payload);
        return JSON.stringify(data);
    };

    static deserialize(data) {
        var messageCodec = JSON.parse(data);
        if (typeof messageCodec.payload !== 'undefined') {
            messageCodec.payload = JSON.parse(messageCodec.payload);
        }
        return messageCodec;
    };
};

class Channel extends EventEmitter  {
    constructor(name) {
        super();
        this.name = name;

        const self = this;
        NativeBridge.registerChannel(name, (_, data) => {
            var messageCodec = MessageCodec.deserialize(data);
            self.emitWrapper(messageCodec.event, ...(messageCodec.payload));
        });
    };

    send(eventName, ...args) {
        var data = MessageCodec.serialize(eventName, ...args)
        NativeBridge.sendMessage(this.name, data);
    };

    emitWrapper(event, ...args) {
        const self = this;
        setImmediate(() => self.emit(event, ...args));
    };
};

const eventChannel = new Channel('EVENT_CHANNEL');
const appChannel = new Channel('APP_CHANNEL');

appChannel.send('ready');

module.exports = exports = {
    channel: eventChannel
};