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
        let self = this;
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



        return new Promise(function (resolve) {

            let files = fs.readdirSync(self.config.schemaPath);

            console.log('Mongodb loading schemas [' + files.join(', ') + ']');
            for (let i = 0; i < files.length; i++) {

                let filePath = self.config.schemaPath + '/' + files[i];

                let fileName = files[i].split('.')[0];

                console.log('Mongodb laoding schema (' + fileName + ') - [' + path.basename(filePath) + ']');

                self[fileName] = require(filePath);
                self[fileName].find({},console.log)
            }
            let connection = mongoose.connect(uri, {
                //server: {},
                //useMongoClient: true,
                //db: {native_parser: true}
                useNewUrlParser: true
            });
            mongoose.connection.once('open', function () {
                console.log('Mongodb open [' + uri + ']');
                mongoose.connect(uri);
                resolve(self)
            });
            mongoose.connection.on('close', function () {
                console.log('Mongodb close [' + uri + ']');
                mongoose.connect(uri);
            });

        })
    }

    stop() {

    }

}

module.exports = Schema