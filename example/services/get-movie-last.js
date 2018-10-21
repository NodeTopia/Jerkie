'use strict';

/**
 * Routes
 */

let routes = [];


routes.push({
    meta: {
        method: 'GET',
        path: 'movies.last',
        version: 1,
        concurrency: 100
    },
    service: function (resolve, reject) {
        let query = {};
        this.schema.Premier.findOne(query).then(resolve).catch(reject)
    }
});


/**
 * Export
 */

module.exports = routes;