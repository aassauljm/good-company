require("babel-core/register");
require("babel-polyfill");
const Promise = require("bluebird");
const fs = Promise.promisifyAll(require("fs"));

global.sails = {
    log: {
        verbose: console.log,
        silly: console.log,
        error: console.log,
        info: console.log,
    },
    config: {}
}

const ScrapingService = require('../api/services/ScrapingService');

const companyNumber = process.argv[2];
const documentId = process.argv[3];

if(!companyNumber){
    console.log('PLEASE PROVIDE COMPANY NUMBER');
    process.exit(1);
}

if(!documentId){
    console.log('DOCUMENT NUMBER');
    process.exit(1);
}

ScrapingService.fetchDocument(companyNumber, documentId)
    .then(function(result){
        console.log(`Writing file to test/fixtures/companies_office/documents/${documentId}.html`);
        return fs.writeFileAsync(`test/fixtures/companies_office/documents/${documentId}.html`, result.text, 'utf-8');
    })
    .then(function(){
        console.log('Done');
        return;
    })
    .catch(function(e){
        console.log('Error', e)
    })



