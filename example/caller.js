const Jerkie = require('../index');

let jerkie = new Jerkie({
    redis: process.env.REDIS_URI
});


async function loop() {
    console.log(await jerkie.call('ticketmaster.movies.id', {id: '5b135425c45cee080beec719'}))
}

setTimeout(loop, 0)