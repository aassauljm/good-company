"use strict";
import Promise from 'bluebird';
import moment from 'moment';
import fetch from "isomorphic-fetch";


export function fetchNameHistory(companies){
    return fetch(sails.config.companyInfoServiceUrl, companies)
        .then(response => repsonse.json())
        .catch(() => [])
}


export function getNameChangeActions(companies, data, docs) {
    const results = [];

    return CompanyInfoService.fetchNameHistory(companies)
        .then(data => {
            data.map(comp => {
                comp.history.slice(0, comp.history.length-1).map((previousName, i) => {
                    results.push({
                        transactionType: Transaction.types.INFERRED_HOLDER_CHANGE,
                        effectiveDate: moment(comp.history[i+1].to, 'DD MMM YYYY').toDate(),
                        actions: [{
                            transactionType: Transaction.types.HOLDER_CHANGE,
                            beforeHolder: {name: comp.history[i+1].name, companyNumber: comp.companyNumber},
                            afterHolder: {name: previousName.name, companyNumber: comp.companyNumber},
                            IGNORABLE: true,
                            effectiveDate: moment(comp.history[i+1].to, 'DD MMM YYYY').toDate(),
                        }]
                    });
                });
            });
            return results;
        })
}