"use strict";
import Promise from 'bluebird';
import moment from 'moment';
import fetch from "isomorphic-fetch";
import https from 'https'
import FormData from 'form-data';



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
            name: person.organisationShareholder.name,
            nzbn: person.organisationShareholder.nzbn,
            address: getRegisteredAddress(person.contacts.physicalOrPostalAddresses)
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
                    return action(accessToken);
                })
            }

            throw error;
        });
}


function normalizeAddresses(company) {
    return Promise.all(company.directorList.directors.map(director => {
        return AddressService.normalizeAddress(director.person.address)
            .then(address => {
                director.person.address = address;
            })
    }))
    .then(() => {
        return Promise.all(company.holdingList.holdings.map(holding => {
            return Promise.all(holding.holders.map(holder => {
                return AddressService.normalizeAddress(holder.person.address)
                    .then(address => {
                        holder.person.address = address;
                    });
                }));
        }));
    })
    .then(() => company)
}

module.exports = {
    fetchUrl: fetchUrl,
    updateAuthority: function(user, company, state) {
        return MbieApiBearerTokenService.getUserToken(user.id, 'companies-office')
            .then(bearerToken => {
                return fetchUrl(bearerToken, `${sails.config.mbie.companiesOffice.url}companies/${state.nzbn}`)
            })
            .then(result => {
                return hasPriviledgedInfo(result.body)
            })
            .catch(e => {
                return null;
            })
            .tap(() => COAuthority.destroy({where: {userId: user.id, companyId: company.id}}))
            .tap(hasAuthority => {
                if(hasAuthority !== null ){
                    return COAuthority.create({userId: user.id, companyId: company.id, allowed: hasAuthority});
                }
            })
            .catch(e => {
                return null;
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

    flatten: function(results) {
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
        company.arFilingMonth = moment().month(results.general.body.annualReturnFilingMonth + 1).format('MMMM');
        company.effectiveDateString = moment().format('D MMM YYYY')
        company.companyFilingYear = (new Date()).getFullYear();
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
                mbieData: director,
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
    },
    merge: function(user, company, state) {
        const date = new Date();
        return MbieSyncService.fetchState(user, company, state)
            .then(MbieSyncService.flatten)
            .then(normalizeAddresses)
            .then((mbieState) => {
                return sequelize.transaction(() => {
                    return Promise.all(mbieState.directorList.directors.map(mbieDirector => {
                        return Promise.all(state.directorList.directors.map(director => {
                            if(director.person.isEqual(mbieDirector.person)){
                                director.setMbieData(mbieDirector.mbieData, date);
                                return director.save();
                            }
                        }));
                    }))
                    .then((results) => {
                        const matches = _.flatten(results).filter(f => f).length;
                        if(matches !== mbieState.directorList.directors.length){
                            throw sails.config.exceptions.MbieMergeFail();
                        }
                    })
                    .then(() => {
                        return state.update({'coVersion': mbieState.etag});
                    })
                });
            })
    },
    arSummary: function(user, company, state) {
        return MbieSyncService.fetchState(user, company, state)
            .then(MbieSyncService.flatten)

    },
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
            },  JSON.stringify(_.pick(values, 'declaration',
                                        'name', 'phoneContact', 'emailAddress', 'designation',
                                            'companyDetailsConfirmedCorrectAsOfETag', 'annualReturnConsentDocumentRef',
                                            'annualReturnShareholderListDocumentRef' )))
        })
        .catch((error) => {
            sails.log.error(error)
            if(error.context.status === 400){
                const message = error.context.body.items[0].message;
                throw sails.config.exceptions.COFailValidation(message)
            }
            if(error.context.status === 401 || error.context.status === 403){
                throw sails.config.exceptions.COUnauthorised()
            }
            if(error.context.status === 500 && error.context.body.errorMessage){

                throw sails.config.exceptions.COFailValidation(error.context.body.errorMessage)
            }
            throw Error(error)
        })

    }

}
