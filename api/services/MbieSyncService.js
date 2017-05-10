"use strict";
import Promise from 'bluebird';
import moment from 'moment';
import fetch from "isomorphic-fetch";
import https from 'https'
import FormData from 'form-data';

const curl = Promise.promisifyAll(require('curlrequest'));



const AR = {
  "declaration": "I certify that the information contained in this annual return is correct.",
  "name": {
    "firstName": "Joe",
    "middleNames": "string",
    "lastName": "Bloggs"
  },
  "phoneContact": {
    "phoneContactId": "123456789",
    "phoneNumber": "1234567",
    "areaCode": "4",
    "link": {
      "rel": "self",
      "href": "http://api.business.govt.nz/services/v1/companies-office/companies-register/companies/123456789"
    },
    "phonePurpose": "Mobile",
    "countryCode": "64"
  },
  "emailAddress": {
    "emailPurpose": "Email",
    "emailAddress": "Joe.Bloggs@mycompany.co.nz",
    "emailAddressId": "123456789",
    "link": {
      "rel": "self",
      "href": "http://api.business.govt.nz/services/v1/companies-office/companies-register/companies/123456789"
    }
  },
  "designation": "Authorised Person",
  "companyDetailsConfirmedCorrectAsOfETag": "2703b543-d6a2-4c27-a699-c0157fefc30a",
  "annualReturnConsentDocumentRef": "686897696a7c8776b7e",
  "annualReturnShareholderListDocumentRef": "686897696a7c8776b7e"
}

//https://www.companiesoffice.govt.nz/companies/learn-about/create-manage-logon/payment-options#establish-dd

function joinName(nameObj){
    return [nameObj.firstName, nameObj.middleNames, nameObj.lastName].filter(f => f).join(' ')
}

function joinAddress(address){
    if(!address){
        return null;
    }
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

function fetchUrl(bearerToken, url, options = {}, headers = {}){
    let fetchOptions = {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'Authorization': `Bearer ${bearerToken}`,
            ...headers
        },
        ...options
    };
    if (__DEV__) {
        fetchOptions.agent = new https.Agent({
            rejectUnauthorized: false,
            keepAlive: true
        });
    }
    sails.log.verbose(JSON.stringify({
        message: 'fetching',
        url,
        fetchOptions
    }))
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


const getUserTokenAndRetry = (user, action) => {
    return MbieApiBearerTokenService.getUserToken(user.id, 'companies-office')
        .then(bearerToken => {
            return action(bearerToken);
        })
        .catch(error => {
            if (error.status === 401) {
                return MbieApiBearerTokenService.refreshUserToken(user.id)
                .then((accessToken) => {
                    return action(bearerToken);
                })
            }

            throw error;
        });
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

        return Promise.mapSeries(urls, url => getUserTokenAndRetry(user, (token) => fetchUrl(token, url)))
         .spread((general, shareholdings, directors) => ({general, shareholdings, directors}))
    },

    flatten: function(user, company, state) {
        return MbieSyncService.fetchState(user, company, state)
            .then(results => {
                const company = {holdingList: {}, directorList:{}};
                const etag = results.general.header.etag[0];
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
                company.etag = etag;
                company.companyName = results.general.body.companyName;
                company.nzbn = results.general.body.nzbn;
                company.ultimateHoldingCompany = results.general.body.isUltimateHoldingCompany;
                company.arFilingMoth = moment().month(results.general.body.annualReturnFilingMonth + 1).format('MMMM');
                company.effectiveDateString = moment().format('D MMM YYYY')
                company.filingYear = (new Date()).getFullYear();
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
    arSummary: function(user, company, state) {
        return MbieSyncService.flatten(user, company, state);
    },
    /*arSubmitff: function(user, company, state, values) {
        const url = `${sails.config.mbie.companiesOffice.url}companies/${state.nzbn}/annual-returns`;
        return getUserTokenAndRetry(user, (token) => {
            return curl.requestAsync({
                    url: url,
                    method: 'POST',
                    //fail: true,
                    include: true,
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    data: JSON.stringify(_.pick(values, 'declaration', 'name', 'phoneContact', 'emailAddress', 'designation',
                                                'companyDetailsConfirmedCorrectAsOfETag', 'annualReturnConsentDocumentRef',
                                                'annualReturnShareholderListDocumentRef' ))
                })
        })
        .tap((result, x) => {
            console.log(result, x);
            sails.log.verbose(result)
        })
        .then(JSON.parse)
        .catch((result) => {
            console.log(result)
            if(result.status === 400){
                sails.log.error(JSON.stringify(result))
                throw sails.config.exceptions.COFailValidation()
            }
            if(result.status === 403){
                throw sails.config.exceptions.COUnauthorised()
            }
            console.log(result);
            throw Error()
        })

    },*/
    /*
    arSubmitWTF: function(user, company, state, values) {
        const url = `${sails.config.mbie.companiesOffice.url}companies/${state.nzbn}/annual-returns`;
        const body =  JSON.stringify(_.pick(values, 'declaration', 'name', 'phoneContact', 'emailAddress', 'designation',
                                            'companyDetailsConfirmedCorrectAsOfETag', 'annualReturnConsentDocumentRef',
                                        'annualReturnShareholderListDocumentRef' ));
        return getUserTokenAndRetry(user, (token) => {
            return fetchUrl(token, url, {
                method: 'POST',
                body: body
            }, {'Content-Type': 'application/json', 'Content-Length': null})
        })
        .then((result) => {
            console.log(result)
            if(result.status === 400){
                sails.log.error(JSON.stringify(result))
                throw sails.config.exceptions.COFailValidation()
            }
            if(result.status === 403){
                throw sails.config.exceptions.COUnauthorised()
            }
            return result.response.text()
        })
        .then(JSON.parse)

    },*/
    arSubmit: function(user, company, state, values) {
        const url = `${sails.config.mbie.companiesOffice.url}companies/${state.nzbn}/annual-returns`;
        return getUserTokenAndRetry(user, (token) => {
            return UtilService.httpsRequest({
                url,
                headers: {
                    'accept': 'application/json',
                    'content-type': 'application/json',
                    'authorization': `Bearer ${token}`,
                },
                rejectUnauthorized: false,
                method: 'POST'
            },  JSON.stringify(_.pick(values, 'declaration', 'name', 'phoneContact', 'emailAddress', 'designation',
                                            'companyDetailsConfirmedCorrectAsOfETag', 'annualReturnConsentDocumentRef',
                                            'annualReturnShareholderListDocumentRef' )))
        })
        .then(response => {
            return response.text()
        })
        .then(JSON.parse)
        .tap((result) => console.log(result))
        .catch((error) => {
            console.log(error)
            if(error.context.status === 400){
                const message = error.context.body.items[0].message;
                throw sails.config.exceptions.COFailValidation(message)
            }
            if(error.context.status === 401 || error.context.status === 403){
                throw sails.config.exceptions.COUnauthorised()
            }
            throw Error(error)
        })

    }

}