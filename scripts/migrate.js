"use strict";
require("babel-core/register");
var moment = require('moment');
var cheerio = require('cheerio');
var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));
var pgp = require('pg-promise')();
var connections = require('../config/connections').connections;
var _ = require('lodash');


var getFiles = function () {
    return fs.readdirAsync(__dirname + '/../migrations');
};

var readFile = function(filename) {
    return fs.readFileAsync(__dirname + '/../migrations/' + filename, 'utf-8');
}

var config;
try{
    config =  require(process.cwd() + '/' + process.argv[2])
}catch(e){
    console.log(e)
    console.log('Please specify config file');
    process.exit(1);
}
connections = _.merge(connections, config.connections);
var dbConfig = connections[config.models.connection];

var db = pgp(dbConfig);
var completed;
db.tx(function (t) {
    return t.query('select name from migrations')
        .then(function(data) {
            console.log('Current Migrations in DB:', data.length);
            completed = data.map(function(d) { return d.name});
            return getFiles();
        })
        .then(function(files) {
            files = _.difference(files, completed);
            files.sort();
            console.log('Pending Migrations:', files.length);
            return Promise.each(files, function(f){
                console.log('Running ', f);
                return readFile(f)
                    .then(function(sql) {
                        return t.none(sql);
                    })
                    .then(function(){
                        console.log('Migration run, adding to DB.')
                        return t.none('insert into migrations(name) values ($1)', [f]);
                    })
            });
        })
        .then(function(){
            return fs.readFileAsync('config/db/functions.sql', 'utf8')
        })
         .then(function(sql){
            return t.none(sql);
        })
})

.then(function(){
    console.log('Migrations Complete.');
    process.exit(0)
})
.catch(function(e){
    console.log('Migration failure')
    console.log(e)
    process.exit(1);
})