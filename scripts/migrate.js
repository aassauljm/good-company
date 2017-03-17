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
    return t.map('select name from migrations', [], a => a.name)
        .then(function(data) {
            console.log('Current Migrations in DB:', data.length);
            completed = data;
            return getFiles();
        })
        .then(function(files) {
            files = _.difference(files, completed);
            files.sort();
            console.log('Pending Migrations:', files.length);
            var queries = files.map(f => {
                console.log('Running ', f);
                let useTransaction;
                return readFile(f)
                    .then(function(sql) {
                        useTransaction = sql.indexOf('--no-transaction') === -1;
                        return sql.indexOf('--split-statements') > -1  ? sql.split(/;/).map(s => s + ';') : [sql]
                    })
                    .then(function(sqls) {
                        var context = useTransaction ?  t : db;
                        return t.batch(sqls.map(s => context.none(s)));
                    })
                    .then(function(){
                        console.log('Migration run, adding to DB.');
                        return t.none('insert into migrations(name) values ($1)', [f]);
                    })
            });
           return t.batch(queries);      
        })
})
.then(function() {
    // this can/should be inside the transaction also ;)
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
