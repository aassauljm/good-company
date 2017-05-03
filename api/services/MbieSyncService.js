"use strict";
import Promise from 'bluebird';
import moment from 'moment';
import fetch from "isomorphic-fetch";
import https from 'https';

const AR = {
  "declaration": "I declare that this annual return is being filed in accordance with the Companies Act.",
  "name": {
    "title": "Dr",
    "firstName": "Joe",
    "middleNames": "string",
    "lastName": "Bloggs"
  },
  "designation": "Authorised Person"
}



function joinName(nameObj){
    return [nameObj.firstName, nameObj.middleNames, nameObj.lastName].filter(f => f).join(' ')
}

function joinAddress(address){
    return [address.address1, address.address2, address.address3, address.postCode, address.countryCode].filter(f => f).join(', ');
}


function findAddress(addresses, type){
    return addresses.find(a => a.addressPurpose === type);
}

function getResidentialAddress(addresses){
    return joinAddress(findAddress(addresses, 'Residential address'));
}


function getRegisteredAddress(addresses){
    return joinAddress(findAddress(addresses, 'Registered office address'));
}

function formatPerson(person){

    if(person.shareholderType === 'Person'){
        return {
            name: joinName(person.personShareholder.name),
            address: getResidentialAddress(person.contacts.physicalOrPostalAddresses)
        }
    }
    if(person.shareholderType === 'Organisation'){
        return {
            companyName: person.organisationShareholder.companyName,
            nzbn: person.organisationShareholder.nzbn,
            address: getResidentialAddress(person.contacts.physicalOrPostalAddresses)
        }
    }

}

function fetchUrl(bearerToken, url){
    let fetchOptions = {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'Authorization': `Bearer ${bearerToken}`
        }
    };
    if (__DEV__) {
        fetchOptions.agent = new https.Agent({
            rejectUnauthorized: false
        });
    }
    return Promise.bind({})
        .then(() => fetch(url, fetchOptions))
        .then(response => {
            if(response.status === 200){
                return response;
            }
            else{
                throw {status: response.status, response: response}
            }
        })
        .then(response => {
            return Promise.all([response.text(), response.headers.raw()])
        })
        .spread((body, header) => {
            return {body: JSON.parse(body), header}
        });
}


function hasPriviledgedInfo(companyInfo) {
    return !!companyInfo.contacts.physicalOrPostalAddresses.find(a => {
        return a.addressPurpose === "Address for communication"
    })
}


module.exports = {
    updateAuthority: function(user, company, state) {
        return MbieApiBearerTokenService.getUserToken(user.id, 'companies-office')
            .then(bearerToken => {
                return fetchUrl(bearerToken, `${sails.config.mbie.companiesOffice.url}companies/${state.nzbn}`)
            })
            .then(result => {
                return hasPriviledgedInfo(result.body)
            })
            .catch(e => {
                console.log(e)
                return false;
            })
            .tap(() => COAuthority.destroy({where: {userId: user.id, companyId: company.id}}))
            .tap(hasAuthority => {
                return COAuthority.create({userId: user.id, companyId: company.id, allowed: hasAuthority})
            })
    },


    fetchState: function(user, company, state) {
        // get auth token,
        // fetch all api endpoints, join together
        const urls = [
            `${sails.config.mbie.companiesOffice.url}companies/${state.nzbn}`,
            `${sails.config.mbie.companiesOffice.url}companies/${state.nzbn}/shareholding`,
            `${sails.config.mbie.companiesOffice.url}companies/${state.nzbn}/directors`,
        ];

        const fetchAndRetry = (bearerToken, url, userId) => {
            return fetchUrl(bearerToken, url)
                .catch(error => {
                    if (error.status === 401) {
                        MbieApiBearerTokenService.refreshUserToken(userId)
                        return fetchUrl(bearerToken, url);
                    }
                    
                    throw error;
                });
        }

        return MbieApiBearerTokenService.getUserToken(user.id, 'companies-office')
            .then(bearerToken => Promise.all(urls.map(url => fetchAndRetry(bearerToken, url, user.id))))
            .spread((general, shareholdings, directors) => ({general, shareholdings, directors}))
            
    },

    flatten: function(user, company, state) {
        return MbieSyncService.fetchState(user, company, state)
            .then(results => {
                const company = {holdingList: {}, directorList:{}};
                const etag = results.general.header.etag;
                const shareholdings = results.shareholdings.body;
                const persons = shareholdings.shareholders.reduce((acc, s) => {
                    acc[s.shareholderId] = s;
                    return acc;
                }, {})
                company.holdingList.holdings = shareholdings.shareAllocations.map(a => {
                    return {
                        parcels: [{amount: a.numSharesInAllocation}],
                        holders: shareholdings.shareholdersInAllocations.filter(s => s.allocationId === a.allocationId).map(a => {
                            return {person: formatPerson(persons[a.shareholderId]), data: {
                                     companiesOffice: {
                                        shareholderId: a.shareholderId
                                    }
                            }}
                        }),
                        data: {
                             companiesOffice: {
                                allocationId: a.allocationId
                            }
                        }
                    }
                });
                company.companyName = results.general.body.companyName;
                company.nzbn = results.general.body.nzbn;
                company.ultimateHoldingCompany = results.general.body.isUltimateHoldingCompany;
                const addressMap = {
                    'Registered office address': 'registeredCompanyAddress',
                    'Address for service': 'addressForService',
                    'Address for communication': 'addressForCommunication',
                }
                results.general.body.contacts.physicalOrPostalAddresses.map(address => {
                    const type = addressMap[address.addressPurpose];
                    if(type){
                        company[type] = joinAddress(address)
                    }
                });
                company.directorList.directors = results.directors.body.items.filter(d => d.roleStatus === 'active').map(director => {
                    const roleId = director.roleId;
                    const contacts = director.contacts;
                    const person = director.personInRole;
                    return {
                        appointment: moment(director.appointedDate, 'YYYY-MM-DD').toDate(),
                        person: {
                            name: joinName(person.name),
                            address: getResidentialAddress(director.contacts.physicalOrPostalAddresses)
                        },
                        data: {
                            companiesOffice: {
                                roleId: director.roleId
                            }
                        }
                    }
                });
                return company;
            })
    },
    merge: function(user, company, state) {
        return MbieSyncService.flatten(user, company, state);
    },
    arSummary: function(user, company, state){
        return MbieSyncService.flatten(user, company, state);;
    }

}
