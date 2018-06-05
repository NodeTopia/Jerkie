const events = require('events');
const path = require('path');
const fs = require('fs');

//
const mongoose = require('mongoose');

class Schema extends events.EventEmitter {
    constructor(config) {
        super()

        this.config = config;
        this.started = false;
    }

    start() {
        if (this.started) {
            return this;
        }
        this.started = true;

        if (this.config.debug) {
            mongoose.set('debug', true);
        }

        let uri;
        if (this.config.uri) {
            uri = this.config.uri
        } else {
            uri = 'mongodb://';

            if (this.config.username && this.config.password) {
                uri += this.config.username + ':' + this.config.password + '@';
            }

            uri += (this.config.host || 'localhost') + ':' + (this.config.port || '27017') + (this.config.path || '/data/db');
        }


        console.log('Mongodb connecting [' + uri + ']');

        mongoose.connect(uri, {
            server: {

            },
            db: {
                native_parser: true
            }
        });
        mongoose.connection.once('open', function () {
            console.log('Mongodb open [' + uri + ']');
        });
        mongoose.connection.on('close', function () {
            console.log('Mongodb close [' + uri + ']');
            mongoose.connect(uri);
        });

        let files = fs.readdirSync(this.config.schemaPath);

        console.log('Mongodb laoding schemas [' + files.join(', ') + ']');

        for (let i = 0; i < files.length; i++) {

            let filePath = this.config.schemaPath + '/' + files[i];

            let fileName = files[i].split('.')[0];

            console.log('Mongodb laoding schema (' + fileName + ') - [' + path.basename(filePath) + ']');

            this[fileName] = require(filePath);
        }
    }

    stop() {

    }

}

module.exports = Schema