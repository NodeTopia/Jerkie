module.exports = function (socket) {
    let ctx = this;
    socket.on('heartbeat', async function () {

        ctx.console.log(ctx)
        socket.emit('pong', await ctx.schema.Premier.find({}))
    });
}