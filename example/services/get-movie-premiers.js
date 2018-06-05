'use strict';

/**
 * Routes
 */

let routes = [];


routes.push({
    meta: {
        method: 'GET',
        path: 'movies.premieres',
        version: '1.0.0'
    },
    service: async function (resolve, reject) {

        let currentDay = new Date()
        let query = {
            releaseYear: {
                $gt: currentDay.getFullYear() - 1,
                $lte: currentDay.getFullYear()
            },
            releaseMonth: {
                $gte: currentDay.getMonth() + 1,
                $lte: currentDay.getMonth() + 2
            },
            releaseDay: {
                $lte: currentDay.getDate()
            }
        };


        resolve(await this.schema.Premier.find({}))
    }
});


/**
 * Export
 */

module.exports = routes;