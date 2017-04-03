require("babel-core/register");
require("babel-polyfill");
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


if(!companyNumber){
    console.log('PLEASE PROVIDE COMPANY NUMBER');
    process.exit(1);
}

ScrapingService.fetch(companyNumber)
    .then(function(data){
        this.data = data;
        return ScrapingService.writeRootDocument(companyNumber, {text: data}, 'test/fixtures/companies_office/futures')
    })
    .then(function(){
        console.log('Parsing')
        return ScrapingService.parseNZCompaniesOffice(this.data);
    })
    .then(function(companyData){
        this.companyData = companyData;
        console.log(JSON.stringify(companyData, null, 4));
        console.log('Writing Docs');
        return ScrapingService.writeDocumentSummaries(companyData, 'test/fixtures/companies_office/futures');
    })
    .then(function(){
        console.log('Pulled ' + this.companyData.documents.length + ' documents');
    });
