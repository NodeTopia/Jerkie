const events = require('events');
const path = require('path');
const fs = require('fs');
const async = require('async');

class Context extends events.EventEmitter {
    constructor(Service, data, middlewares, methods, resolve, reject, meta, service, event) {
        super();

        this.jerkie = Service.jerkie;

        Object.getOwnPropertyNames(Service).forEach(function (key) {
            if (['schema','_events','_eventsCount','_maxListeners','config','console','nconf'
                ,'Service','pubsub','kue','broadcast','kue','kue'].indexOf(key) === -1) {
                this[key] = Service[key];
            }

        }, this);


        this.data = Object.assign({}, data);
        this.middlewares = middlewares;
        this.middleware = {};
        this.methods = methods;


        this.meta = meta;
        this.service = service;
        this.event = event;


        this.resolve = resolve;
        this.reject = reject;

        if (event) {
            this.service(data)
        } else {
            let self = this;
            let tasks = Object.entries(middlewares || {}).map(function (item) {
                let [name, fn] = item;
                return function (next) {

                    let startTime = Date.now();


                    let resolve = function (result) {
                        self.middleware[name] = result;
                        Service.jerkie.metrics.timing(`${meta.path}.${name}.method`, Date.now() - startTime);
                        console.log(`Context ${meta.path} running middleware "${name}" (${Date.now() - startTime}ms)`);
                        next();
                    };

                    try {
                        fn.bind(self)(resolve, function(err){
                            next(err)
                            Service.jerkie.metrics.timing(`${meta.path}.${name}.error`, Date.now() - startTime);
                            console.log(`Context ${meta.path} running middleware "${name}" (${Date.now() - startTime}ms)`);

                        })
                    } catch (err) {
                        Service.jerkie.metrics.timing(`${meta.path}.${name}.error`, Date.now() - startTime);
                        console.log(`Context ${meta.path} running middleware "${name}" (${Date.now() - startTime}ms)`);

                        next(err)
                    }
                }
            });
            async.series(tasks, function (err, results) {
                if (err) {
                    return reject(err)
                }
                try {
                    self.service(resolve, reject)
                } catch (err) {
                    reject(err)
                }

            });

        }

    }

    get schema() {
        return this.jerkie.schema;
    }


    get console() {
        return console;
    }

    get config() {
        return this.jerkie.nconf;
    }

    call(method, data, options) {
        return this.jerkie.call(method, data, options)
    }

    wait(name, options) {
        let self = this;
        return new Promise(function (resolve, reject) {

            self.jerkie.pubsub.on(name, function cb(con) {
                self.jerkie.pubsub.removeListener(name, cb);
                resolve(arguments);
            });

        })
    }

    broadcast(event, data) {
        this.jerkie.broadcast(event, data)
    }


}

module.exports = Context