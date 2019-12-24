module.exports = async function (socket, next) {
    let ctx = this;
    let handshakeData = socket.request;
    let id = handshakeData._query.id;
    let token = handshakeData._query.token;
console.log(ctx)
    if (token === await this.config.get('fleet:io:token')) {
        next()
    } else {
        next(err);
    }
}