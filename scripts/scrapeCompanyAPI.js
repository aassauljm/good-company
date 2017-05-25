"use strict";
require("babel-core/register");
require("babel-polyfill");
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require("fs"));

global.__DEV__  =false;
var config;
try{
    config =  require(process.cwd() + '/' + process.argv[2])
}catch(e){
    console.log(e)
    console.log('Please specify config file');
    process.exit(1);
}
global.sails ={ config: config,
    log: {
        verbose: console.log,
        silly: console.log,
        error: console.log,
        info: console.log,
    }, };



const nzbn = process.argv[3];
const token = process.argv[4];
const path = `test/fixtures/companies_office/api/${nzbn}`
const MbieSyncService = require('../api/services/MbieSyncService');

const urls = [
    `${sails.config.mbie.companiesOffice.url}companies/${nzbn}`,
    `${sails.config.mbie.companiesOffice.url}companies/${nzbn}/shareholding`,
    `${sails.config.mbie.companiesOffice.url}companies/${nzbn}/directors`
    ];


if (!fs.existsSync(path)){
    fs.mkdirSync(path);
}

Promise.all(urls.map(url => MbieSyncService.fetchUrl(token, url)))
    .spread((general, shareholdings, directors) => ({general, shareholdings, directors}))
    .then(results => {

        function write(name, data){
            return fs.writeFileAsync(`${path}/${name}.json`, JSON.stringify(data, null, 4), 'utf-8');
        }
        return Promise.all([write('general', results.general),write('shareholdings', results.shareholdings), write('directors', results.directors)]);
    })

