const Jerkie = require('../index');

let jerkie = new Jerkie({
    redis: process.env.REDIS_URI || 'redis://:J36Xd9lD2abnwapo3vLjWY0pp5FC8W6A@127.0.0.1:6379'
});


async function loop() {
    console.log(await jerkie.call('ticketmaster.movies.id', {id: '5bcbbb200ebe1e0ba81d2a38'}))
}

async function add() {
    console.log(await jerkie.call('ticketmaster.movies.premieres.add', {
        title: "Showtimes for Halloween",
        format: "IMAX",
        releaseYear: 2017,
        releaseMonth: 1,
        releaseDay: 31
    }))
}

setTimeout(loop, 1000)