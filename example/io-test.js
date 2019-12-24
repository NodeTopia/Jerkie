var socket = require('socket.io-client')('http://localhost:9000');
socket.on('connect', function () {
    console.log('connect')
});
socket.on('event', function (data) {
    console.log('event', data)
});
socket.on('pong', function (data) {
    console.log('pong', data)
});
socket.on('disconnect', function () {
    console.log('disconnect')
});
socket.on('error', function (error) {
    console.log('error', error)
});

socket.emit('heartbeat')