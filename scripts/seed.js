"use strict";
require("babel-polyfill");
var Sails = require('sails');
var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));
var deepMerge = require('deepmerge');

var config;
try{
    config =  require(process.cwd() + '/' + process.argv[2])
}catch(e){
    console.log(e)
    console.log('Please specify config file');
    process.exit(1);
}

function addMigrations() {
    console.log('- Running migrations');
    return fs.readdirAsync(__dirname + '/../migrations')
        .then(function(files){
            console.log();
            return Migrations.bulkCreate(files.map(function(f){ return {name: f}}));
        }).then(() => {
            console.log('- Finished migrations');
        });
}

function lift(cb){
    console.log('==============================');
    console.log('Seeding database')
    console.log('========');

    console.log('- Lifting sails')

    let sailsConfig = deepMerge.all([{
            port: 1338,
            serverRender: true,
            log: {
                level: 'verbose'
            },
            fixtures: false,
            hooks: {
                orm: false,
                blueprints: false,
                grunt: false,
                sockets: false,
                pubsub: false,
                permissions: false,
            },
            passport: {
                local: true,
            },
            session: {
                adapter: 'memory'
            },
            test: true,
            renderServiceUrl: 'localhost:5668',
            CACHE_DIR: '/tmp/.gc_test'
        },
        {
            connections: config.connections,
            models: config.models
        },
        {
            models: {
                migrate: 'alter'
            }
        }]
    );

    return new Promise((resolve, reject) => {
        Sails.lift(sailsConfig, (error) => {
            console.log('- Sails lifted');

            if (error) {
                reject(error);
            }

            resolve();
        });
    });
}

lift()
    .then(addMigrations)
    .then(() => {
        process.exit(0);
    }).catch(console.log);

