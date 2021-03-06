"use strict";
import Promise from 'bluebird';
import moment from 'moment';
import fetch from "isomorphic-fetch";


export function fetchNameHistory(companies){
    return fetch(sails.config.companyInfoServiceUrl,
        {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify(companies)
        })
        .then(response => response.json())
        .catch((e) => {
            sails.log.error(e);
            return [];
        })
}

export function fetchNZBN(nzbns){
    return fetch(`${sails.config.companyInfoServiceUrl}/nzbn`,
        {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify(nzbns)
        })
        .then(response => response.json())
        .catch((e) => {
            sails.log.error(e)
            return [];
        })
}

export function getNameChangeActions(companies, sourceData, docs) {
    const results = [];

    return CompanyInfoService.fetchNameHistory(companies)
        .then(data => {
            data.map(comp => {
                comp.history.slice(0, comp.history.length-1).map((previousName, i) => {
                    results.push({
                        transactionType: Transaction.types.INFERRED_HOLDER_CHANGE,
                        effectiveDate: moment(comp.history[i+1].endDate, 'DD MMM YYYY').toDate(),
                        actions: [{
                            transactionType: Transaction.types.HOLDER_CHANGE,
                            beforeHolder: {name: comp.history[i+1].name, companyNumber: comp.companyNumber},
                            afterHolder: {name: previousName.name, companyNumber: comp.companyNumber},
                            IGNORABLE: true,
                            effectiveDate: moment(comp.history[i+1].endDate, 'DD MMM YYYY').toDate(),
                        }]
                    });
                });
            });
            const incorporationDate = moment(sourceData.incorporationDate, 'DD MMM YYYY').toDate();
            return results.filter(r => r.effectiveDate > incorporationDate);
        })
}


export function getCompanyNamesFromNZBNS(list) {
    sails.log.verbose('Looking up list', list);
    const nzbns = _.uniq(list.map(x => x.nzbn));
    return fetchNZBN(nzbns)
        .then(results => {
            sails.log.verbose('fetched from companyinfo: ', results);
            const mapping = (results || []).reduce((acc, result) => {
                acc[result.nzbn] = result;
                return acc;
            }, {});
            return nzbns.map(nzbn => {
                if(mapping[nzbn]){
                    return {nzbn: mapping[nzbn].nzbn, companyName: mapping[nzbn].company_name, companyNumber: mapping[nzbn].company_number}
                }
                else{
                    return {nzbn, companyName: 'Unknown Company', companyNumber: 'Unknown', unknown: true}
                }
            })
        })
        .then((results) => {
            const unknowns = results.filter(r => r.unknown);
            if(unknowns.length){
                const knowns = results.filter(r => !r.unknown);
                return Promise.all(unknowns.map(unknown=> MbieApiService.lookupByNzbn(unknown.nzbn).catch(() => ({}))))
                    .then(results => {
                        return [...results.map(result => ({
                            nzbn: result.nzbn, companyName: result.entityName,  companyNumber: result.sourceRegisterUniqueIdentifier
                        })), ...knowns]
                    });
            }
            return results;
        })
}
