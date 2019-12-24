var redis = require('redis');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
const PubSub = require('noderedispubsub');

function Socket(opts) {
    EventEmitter.call(this);


    if (typeof opts === 'string') {
        this.opts = opts;
        this.opts = require("redis-url").parse(opts);
        this.opts.auth = this.opts.password;
        this.opts.host = this.opts.hostname;
    } else {
        this.opts = opts || {};
    }

    this.opts.return_buffers = true;
}

util.inherits(Socket, EventEmitter);

Socket.prototype.bind = function (port, address, callback) {

    let self = this;
    this.pubsub = new PubSub(Object.assign({}, this.opts, {
        prefix: 'network'
    }));

    this.pubsub.on('m', function (message) {
        self.emit('message', message, {address: '0.0.0.0', port: port});
    })

    this.emit('listening');
    callback()
};

Socket.prototype.setBroadcast = function () {
};

Socket.prototype.addMembership = function () {
};

Socket.prototype.setMulticastTTL = function () {
};

Socket.prototype.close = function () {

};

Socket.prototype.send = function (msg, offset, length, port, address) {
    this.pubsub.emit('m', msg);
}

function createSocket(opts) {
    return new Socket(opts);
}

module.exports = {
    createSocket: createSocket
}