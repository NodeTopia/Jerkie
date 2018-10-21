'use strict';

/**
 * Routes
 */

let routes = [];


routes.push({
    meta: {
        method: 'GET',
        path: 'movies.id',
        version: 1,
        concurrency: 100
    },
    checks: {
        id: {type: "string", length: 24}
    },
    middleware: {
        last: async function (resolve, reject) {
            let last
            try {
                last = await this.call('ticketmaster.movies.last')
            } catch (err) {
                return reject(err)
            }
            resolve(last)
        }
    },
    service: async function (resolve, reject) {


        let query = {
            _id: this.data.id
        };
        console.log('this.middleware[last]', this.middleware['last'])

        resolve(await this.schema.Premier.findOne(query))
    },
    events: {
        "user.created"(payload) {
            this.logger.info("User created:", payload);
            // Do something
        }
    }
});


/**
 * Export
 */

module.exports = routes;