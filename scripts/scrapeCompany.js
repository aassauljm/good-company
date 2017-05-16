"use strict";
require("babel-core/register");
require("babel-polyfill");
const promise = require('bluebird');
global.sails = {
    log: {
        verbose: console.log,
        silly: console.log,
        error: console.log,
        info: console.log,
    },
    config: {
        COMPANIES_OFFICE_URL: process.argv[4] || 'https://www.companiesoffice.govt.nz/'
    }
}

const ScrapingService = require('../api/services/ScrapingService');

const companyNumber = process.argv[2];

let path = process.argv[3] || 'test/fixtures/companies_office/';

if(path[path.length-1] !== '/'){
    path += '/'
}


if(!companyNumber){
    console.log('PLEASE PROVIDE COMPANY NUMBER');
    process.exit(1);
}


ScrapingService.fetch(companyNumber)
    .bind({})
    .then(function(data){
        this.data = data;
        return ScrapingService.writeRootDocument(companyNumber, {text: data}, path)
    })
    .then(function(){
        console.log('Parsing')
        return ScrapingService.parseNZCompaniesOffice(this.data);
    })
    .then(function(companyData){
        this.companyData = companyData;
        console.log(JSON.stringify(companyData, null, 4));
        console.log('Writing Docs');
        return ScrapingService.writeDocumentSummaries(companyData, path);
    })
    .then(function(){
        console.log('Pulled ' + this.companyData.documents.length + ' documents');
    });
