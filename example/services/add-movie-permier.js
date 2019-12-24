'use strict';

/**
 * Routes
 */

let routes = [];


routes.push({
    meta: {
        method: 'POST',
        path: 'movies.premieres.add',
        version: 1,
        concurrency: 100
    },
    service: async function (resolve, reject) {

        let ctx = this;


        let doc = new ctx.schema.Premier({
            title: this.data.title,
            format: this.data.format,
            releaseYear: this.data.releaseYear,
            releaseMonth: this.data.releaseMonth,
            releaseDay: this.data.releaseDay
        });
        await doc.save();

        resolve(await ctx.call('ticketmaster.movies.id', {id: doc._id}))
    },
    events: {
        "user.created"(payload) {
            this.console.info("User created:", payload);
            // Do something
        }
    }
});


/**
 * Export
 */

module.exports = routes;