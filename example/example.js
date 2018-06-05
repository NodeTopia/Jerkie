const Jerkie = require('../index');
const path = require('path');

var socketio = require('socket.io');


let service = new Jerkie({
    redis: process.env.REDIS_URI,
    name: 'ticketmaster',
    schema: path.resolve(__dirname, './schema'),
    services: path.resolve(__dirname, './services'),
    methods: {
        connection: function (socket) {
            let ctx = this;
            socket.on('heartbeat', async function () {
                ctx.console.log('ping')
                socket.emit('pong', await ctx.call('ticketmaster.movies.premieres'))
            });
        },
        use: path.resolve(__dirname, './methods/use.js'),
        dir: path.resolve(__dirname, './methods/dir')

    },
    start: async function () {
        this.io = socketio(await this.config.get('io:port') || 9000);
        this.io.use(this.use);
        this.io.on('connection', this.connection);
    },
    stop: function () {

    }
});

service.start();