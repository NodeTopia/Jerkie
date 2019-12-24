const events = require('events');

const Redis = require('ioredis');
const kue = require('kue');
const PubSub = require('noderedispubsub');
const Metrics = require('statsd-metrics');

const Logger = require('raft-logger-redis').Logger;

let Config = require('./lib/nconf-redis');
const Schema = require('./lib/schema');
const Services = require('./lib/services');
const KueError = require('./lib/kue-error')


class Jerkie extends events.EventEmitter {
    constructor(config) {
        super();

        this.config = config;

        if (!this.config.name) {
            this.config.name = 'default';
        }
        if (typeof this.config.redis === 'string') {
            this.config.redis = require("redis-url").parse(this.config.redis);
            this.config.redis.auth = this.config.redis.password;
            this.config.redis.host = this.config.redis.hostname;
        }


        this.load();

    }

    get prefix() {
        return this.config.name;
    }

    async start() {
        await this.loadschema();
        await this.loadsservices();
    }

    async stop() {

    }

    async load() {
        this.loadnconf();
        this.loadkue();
        this.loadpubsub();
        await this.loadmetrics();
        await this.loadloags();
    }

    loadnconf() {
        this.nconf = new Config(Object.assign({}, this.config.redis, {
            namespace: this.prefix
        }));
    }

    loadkueHTTP() {
        this.kue.on('job enqueue', function(id, type) {
            kue.Job.get(id, function(err, job) {
                if (err)
                    return;
                console.log('job %s got queued %s', id, job.type);
            });
        }).on('job complete', function(id, result) {
            kue.Job.get(id, function(err, job) {
                if (err)
                    return;
                console.log('job %s complete %s', id, job.type);
            });
        }).on('job failed', function(id, result) {
            kue.Job.get(id, function(err, job) {
                if (err)
                    return;
                console.log('job %s failed %s', id, job.type);
            });
        });
        kue.app.listen(3001);
    }
    loadkue() {
        let self = this;
        this.kue = kue.createQueue({
            redis: self.config.redis
        });
    }

    loadpubsub() {
        this.pubsub = new PubSub(Object.assign({}, this.config.redis, {
            prefix: 'pubsub'
        }));
    }

    async loadmetrics() {
        let statsd = await this.nconf.get('stats:service');
        this.metrics = new Metrics(Object.assign({}, {
            port: 8125,
            host: '127.0.0.1'
        }, statsd, {
            prefix: this.prefix
        }));
    }

    async loadloags() {
        let logs = await this.nconf.get('logs:service');

        if (logs) {
            this.logger = Logger.createLogger(logs);
            this.console = this.logger.create({
                source: 'service',
                channel: `${this.prefix}.${process.env.INDEX || 0}`,
                session: logs.session,
                bufferSize: 1
            })
        } else {
            this.console = console;
        }


    }

    async loadschema() {
        if (this.config.schema) {
            this.schema = new Schema(Object.assign({}, await this.nconf.get('mongodb'), {schemaPath: this.config.schema}));
            return this.schema.start()
        }
        return Promise.resolve()
    }

    async loadsservices() {
        if (this.config.schema) {
            this.Service = new Services(this);
            this.Service.start()
        }
    }

    async call(method, data, options) {
        let self = this;
        data = data || {};
        options = options || {remove: true};

        return new Promise(function (resolve, reject) {
            let job = self.kue.create(method, data);

            job.once('complete', resolve);
            job.once('failed', function (error) {
                reject(new KueError(error.message, error.stack))
            });
            if (options.ttl) {
                job.ttl(options.ttl)
            }
            if (options.priority) {
                job.priority(options.priority)
            }
            if (options.delay) {
                job.delay(options.delay)
            }
            if (options.attempts) {
                job.attempts(options.attempts)
                if (options.backoff) {
                    job.backoff(options.backoff)
                }
            }

            //job.removeOnComplete(true);

            job.save(function (err) {
                if (err) {
                    reject(err)
                }
            });

        })
    }

    broadcast(event, data) {
        this.pubsub.emit(event, data)
    }

    static get mongoose() {
        return require('mongoose');
    }
}

module.exports = Jerkie

