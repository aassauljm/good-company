"use strict";
require("babel-core/register");
var moment = require('moment');
var cheerio = require('cheerio');
var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));
var pgp = require('pg-promise')();
var connections = require('../config/connections').connections;
var ORDERED_DB_SCRIPTS = require('../api/hooks/db')(null).ORDERED_DB_SCRIPTS;
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
                let useTransaction;
                return readFile(f)
                    .then(function(sql) {
                        useTransaction = sql.indexOf('--no-transaction') === -1;
                        return sql.indexOf('--split-statements') > -1  ? sql.split(/;/).map(s => s + ';') : [sql]
                    })
                    .then(function(sqls) {
                        return useTransaction ?  Promise.each(sqls, t.none) : Promise.each(sqls, db.none)
                    })
                    .then(function(){
                        console.log('Migration run, adding to DB.');
                        return t.none('insert into migrations(name) values ($1)', [f]);
                    })
            });
        })
})
.then(function() {
    return Promise.each(ORDERED_DB_SCRIPTS, (file) => {
        console.log('Reading: ', file);
        return fs.readFileAsync(file, 'utf8')
    .then(sql => {
        return db.none(sql);
    })});
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