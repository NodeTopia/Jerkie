const events = require('events');
const path = require('path');
const fs = require('fs');
const Validator = require("fastest-validator");
const Context = require('./context');
const uuid = require('node-uuid');

class Services extends events.EventEmitter {
    constructor(jerkie) {
        super()
        this.jerkie = jerkie;
        this.services = [];
        this.methods = {};
        this.v = new Validator();
        this.checks = {};
    }

    get schema() {
        return this.jerkie.schema;
    }

    get console() {
        return console;
    }

    get metrics() {
        return this.jerkie.metrics;
    }

    get config() {
        return this.jerkie.nconf;
    }

    call(method, data, options) {
        return this.jerkie.call(method, data, options)
    }

    broadcast(event, data) {
        this.jerkie.broadcast(event, data)
    }

    async start() {
        let self = this;

        let files = fs.readdirSync(this.jerkie.config.services);
        for (let i = 0; i < files.length; i++) {
            let filePath = this.jerkie.config.services + '/' + files[i];

            if (fs.lstatSync(filePath).isDirectory()) {

                let files = fs.readdirSync(filePath);

                for (let i = 0; i < files.length; i++) {
                    let innerFilePath = filePath + '/' + files[i];

                    require(innerFilePath).forEach(function (item) {
                        console.log(`Jerkie loading service ${self.jerkie.prefix}.${item.meta.path}`);
                        self._addService(item)
                    });
                }
            } else {
                require(filePath).forEach(function (item) {
                    console.log(`Jerkie loading service ${self.jerkie.prefix}.${item.meta.path}`);
                    self._addService(item)
                });
            }


        }


        for (let [name, method] of Object.entries(this.jerkie.config.methods || {})) {

            if (["schema"].indexOf(name) !== -1) {
                throw new Error(`Invalid method name '${name}' in '${this.name}' service!`);
            }

            if (typeof method === 'string') {
                if (fs.lstatSync(method).isDirectory()) {
                    let files = fs.readdirSync(method);
                    this.methods[name] = {};
                    for (let i = 0; i < files.length; i++) {
                        let filePath = method + '/' + files[i];
                        let fileName = files[i].split('.')[0];
                        console.log(`Jerkie loading method ${this.jerkie.prefix}.methods.${name}.${fileName}`);
                        this.methods[name][fileName] = require(filePath).bind(this);
                    }
                } else {
                    console.log(`Jerkie loading method ${this.jerkie.prefix}.methods.${name}`);
                    this.methods[name] = require(method).bind(this);
                }
            } else {
                console.log(`Jerkie loading method ${this.jerkie.prefix}.methods.${name}`);
                this.methods[name] = method.bind(this);
            }


        }
        if (this.jerkie.config.start) {
            console.log(`Jerkie calling start ${this.jerkie.prefix}`);
            await this.jerkie.config.start.call(this)
        }

    }

    async stop() {
        if (this.jerkie.config.stop) {
            await this.jerkie.config.stop.call(this)
        }
    }

    _addService(item) {

        let {meta, service, events, middleware, params} = item;

        let self = this;


        if (params) {
            this.checks[meta.path] = this.v.compile(params);
        }


        async function serviceCallback(job, done) {
            let startTime = Date.now();

            self.metrics.inc(`${meta.path}.process`);

            console.log(`Service ${self.jerkie.prefix}.${meta.path} has been called`);


            new Promise(async function (resolve, reject) {

                if (self.checks[meta.path]) {
                    let errors = self.checks[meta.path](job.data);
                    if (errors !== true) {
                        return reject(new Error(errors[0].message))
                    }
                }

                new Context(self, job.data, middleware, self.methods, resolve, reject, meta, service, false)
            }).catch(function (error) {
                self.metrics.timing(`${meta.path}.error`, Date.now() - startTime);

                let err = {};
                Object.getOwnPropertyNames(error).forEach(function (key) {
                    err[key] = error[key];
                }, this);

                self.metrics.inc(`${meta.path}.error`);
                console.log(`Service ${self.jerkie.prefix}.${meta.path} has thrown an error ${error.message} (${Date.now() - startTime}ms)`);

                done(err)
            }).then(function (result) {

                console.log(`Service ${self.jerkie.prefix}.${meta.path} has finished (${Date.now() - startTime}ms)`);
                self.metrics.timing(`${meta.path}.process`, Date.now() - startTime);
                done(null, result)
            })
        }


        this.jerkie.kue.process(`${this.jerkie.prefix}.${meta.path}`, meta.concurrency || 1, serviceCallback);

        if (events) {
            for (let [event, fn] of Object.entries(events)) {

                console.log(`Jerkie loading event for ${meta.path} named ${event}`);
                this.jerkie.pubsub.on(event, function (data) {
                    self.metrics.inc(`${event}.events`)
                    try {
                        new Context(self, data, null, self.methods, null, null, meta, fn, true)
                    } catch (err) {
                        //console.log(err)
                    }

                })
            }
        }

    }

}

module.exports = Services;