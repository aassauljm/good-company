const _ = require('lodash');
const moment = require('moment');
const Promise = require('bluebird');
const cls = require('continuation-local-storage');
const session = cls.getNamespace('session');

export function validateAnnualReturn(data, companyState){
    const state = companyState.toJSON();
    return companyState.stats()
        .then((stats) => {
            if(stats.totalShares != data.totalShares){
                sails.log.error('stats: ', stats, data.totalShares)
                throw new sails.config.exceptions.InvalidInverseOperation('Total shares do not match, documentId: ' +data.documentId);
            }
            // extract address and name for directors
            const currentDirectors = JSON.stringify(_.sortBy(_.map(state.directorList.directors, (d)=>_.pick(d.person, 'name'/*, 'address'*/)), 'name'));
            const expectedDirectors = JSON.stringify(_.sortBy(_.map(data.directors, (d)=>_.pick(d, 'name'/*, 'address'*/)), 'name'));

            const holdingToString = (holdings) =>{
                return _.sortByAll(holdings.map((holding)=>{
                    return  {holders: _.sortBy(holding.holders.map((p)=>_.pick(p, 'name')), 'name'), parcels: holding.parcels.map((p)=>_.pick(p, 'amount'))};
                }), (holding) => -holding.parcels[0].amount, (holding) => holding.holders[0].name);

            }

            const currentHoldings = holdingToString(state.holdingList.holdings)
            const expectedHoldings = holdingToString(data.holdings)

            if(JSON.stringify(currentDirectors) != JSON.stringify(expectedDirectors)){
                sails.log.error('Current directors: '+JSON.stringify(currentDirectors) + 'documentId: ' +data.documentId)
                sails.log.error('Expected directors: '+JSON.stringify(expectedDirectors))
                throw new sails.config.exceptions.InvalidInverseOperation('Directors do not match: ' +data.documentId);
            }
            if(JSON.stringify(currentHoldings) !== JSON.stringify(expectedHoldings)){
                sails.log.error('Current', JSON.stringify(currentHoldings))
                sails.log.error('Expected', JSON.stringify(expectedHoldings))
                throw new sails.config.exceptions.InvalidInverseOperation('Holdings do not match, documentId: ' +data.documentId);
            }
            return Promise.join(
                         AddressService.normalizeAddress(data.registeredCompanyAddress),
                         AddressService.normalizeAddress(data.addressForService)
                         )
            })
        .spread((registeredCompanyAddress, addressForService) => {
             if(!AddressService.compareAddresses(state.registeredCompanyAddress, registeredCompanyAddress) ||
                 !AddressService.compareAddresses(state.addressForService, addressForService)){
                sails.log.error(state.registeredCompanyAddress, registeredCompanyAddress)
                sails.log.error(state.addressForService, addressForService)
                throw new sails.config.exceptions.InvalidInverseOperation('Addresses do not match, documentId: ' +data.documentId);
             }
        })
};

export function validateInverseAmend(amend, companyState){
    const holding = companyState.getMatchingHolding({holders: amend.afterHolders, parcels: [{amount: amend.afterAmount, shareClass: amend.shareClass}]});
    if(!holding){
        throw new sails.config.exceptions.InvalidInverseOperation('Matching Holding not found, documentId: ' +amend.documentId)
    }
    const sum = _.sum(holding.dataValues.parcels, (p) =>{
        return p.amount;
    });
    if(!Number.isSafeInteger(sum)){
        throw new sails.config.exceptions.InvalidInverseOperation('Unsafe number, documentId: ' +amend.documentId)
    }
    if(amend.beforeAmount < 0 || amend.afterAmount < 0){
        throw new sails.config.exceptions.InvalidInverseOperation('Before and after amounts must be natural numbers ( n >=0 ), documentId: ' +amend.documentId)
    }
    if(amend.afterAmount && (sum !== amend.afterAmount)){
        throw new sails.config.exceptions.InvalidInverseOperation('After amount does not match, amend, documentId: ' +amend.documentId)
    }
    return Promise.resolve(holding);
}



export function validateInverseIssue(data, companyState){
    return companyState.stats()
        .then((stats) =>{
            if(!Number.isInteger(data.amount) || data.amount <= 0){
                throw new sails.config.exceptions.InvalidInverseOperation('Amount must be natural number ( n >=0 ), documentId: ' +data.documentId)
            }
            if(!Number.isSafeInteger(data.amount)){
                throw new sails.config.exceptions.InvalidInverseOperation('Unsafe number, documentId: ' +data.documentId)
            }
            if(stats.totalShares !== data.toAmount){
                sails.log.debug(stats)
                throw new sails.config.exceptions.InvalidInverseOperation('After amount does not match, issue, documentId: ' +data.documentId)
            }
            if(data.fromAmount + data.amount !== data.toAmount ){
                throw new sails.config.exceptions.InvalidInverseOperation('Issue amount sums to not add up, documentId: ' +data.documentId)
            }
        })
}

export function validateInverseAcquistion(data, companyState){
    return companyState.stats()
        .then((stats) =>{
            if(!Number.isInteger(data.amount) || data.amount <= 0){
                throw new sails.config.exceptions.InvalidInverseOperation('Amount must be natural number ( n >=0 ), documentId: ' +data.documentId)
            }
            if(!Number.isSafeInteger(data.amount)){
                throw new sails.config.exceptions.InvalidInverseOperation('Unsafe number, documentId: ' +data.documentId)
            }
            if(stats.totalShares !== data.toAmount){
                sails.log.debug(stats)
                throw new sails.config.exceptions.InvalidInverseOperation('After amount does not match, issue, documentId: ' +data.documentId)
            }
            if(data.fromAmount - data.amount !== data.toAmount ){
                throw new sails.config.exceptions.InvalidInverseOperation('Acquisition amount sums to not add up, documentId: ' +data.documentId)
            }
        })
}

export function performInverseIssueUnallocated(data, companyState, previousState, effectiveDate){
    return validateInverseIssue(data, companyState)
        .then(() => {
            const match = companyState.subtractUnallocatedParcels({amount: data.amount, shareClass: data.shareClass});
            const transaction = Transaction.build({type: data.transactionSubType || data.transactionType, data: {...data, shareClass: match.shareClass}, effectiveDate: effectiveDate})
            return transaction;
        })
}


export function performInverseAcquisition(data, companyState, previousState, effectiveDate){
    return validateInverseAcquistion(data, companyState)
        .then(() => {
            const match = companyState.combineUnallocatedParcels({amount: data.amount, shareClass: data.shareClass});
            const transaction = Transaction.build({type: data.transactionSubType || data.transactionType, data: {...data, shareClass: match.shareClass}, effectiveDate: effectiveDate})
            return transaction;
        })
}

export  function performInverseAmend(data, companyState, previousState, effectiveDate){
    let transaction, holding, prevHolding;
    data = _.cloneDeep(data);
    return Promise.resolve({})
        .then(() => {
            return validateInverseAmend(data, companyState)
        })
        .then((_holding) => {
            holding = _holding;
            return companyState.dataValues.holdingList.buildNext();
        })
        .then(holdingList => {
            companyState.dataValues.holdingList = holdingList;
            companyState.dataValues.h_list_id = null;
            const difference = data.afterAmount - data.beforeAmount;
            const parcel = {amount: Math.abs(difference), shareClass: data.shareClass};
            const newHolding = {holders: data.afterHolders, parcels: [parcel]};
            if(!data.shareClass){
                data.shareClass = parcel.shareClass = _.find(holding.dataValues.parcels, p => data.afterAmount === p.amount).shareClass;
            }
            const transactionType  = data.transactionSubType || data.transactionType;

            if(difference < 0){
                const match = companyState.subtractUnallocatedParcels(parcel);
                if(!parcel.shareClass){
                    data.shareClass = parcel.shareClass = match.shareClass;
                }
                companyState.combineHoldings([newHolding], [{amount: data.afterAmount, shareClass: parcel.shareClass}]);
            }
            else{
                companyState.subtractHoldings([newHolding], [{amount: data.afterAmount, shareClass: parcel.shareClass}]);
                companyState.combineUnallocatedParcels(parcel);
            }
            const current = companyState.getMatchingHolding({holders: data.afterHolders,  parcels: [{amount: data.beforeAmount, shareClass: parcel.shareClass}]})

            // If holders have changed too
            if(!current.holdersMatch({holders: data.beforeHolders})){
                companyState.mutateHolders(current, data.beforeHolders);
            }
            transaction = Transaction.build({type: data.transactionSubType || transactionType,  data: data, effectiveDate: effectiveDate});
            return transaction.save();
        })
        .then(() => {
            prevHolding = previousState.getHoldingBy({holdingId: holding.holdingId});
            // if we inferred shareClass from unallocatedParcels, lets assign it here (mutate it)
            if(data.shareClass && !_.find(prevHolding.parcels, p => p.shareClass)){
                return Promise.all(prevHolding.dataValues.parcels.map(p => p.replace({shareClass: data.shareClass})).map(p => p.save()))

            }
        })
        .then(parcels => {
            if(parcels){
                prevHolding.setParcels(parcels);
            }
            prevHolding.set('transactionId', transaction.id);
            return prevHolding.save();
        })
        .then(() => {
            return transaction;
        });
};



export function performInverseHoldingChange(data, companyState, previousState, effectiveDate){
    const transaction = Transaction.build({type: data.transactionType,  data: data, effectiveDate: effectiveDate});
    const normalizedData = _.cloneDeep(data);
    return companyState.dataValues.holdingList.buildNext()
        .then(holdingList => {
            companyState.dataValues.holdingList = holdingList;
            companyState.dataValues.h_list_id = null;
            return transaction.save()
        })
        .then(() => {
            return Promise.all([Promise.all(normalizedData.afterHolders.map(h => {
                AddressService.normalizeAddress(h.address)
                    .then(address => h.address = address)

            })), Promise.all(normalizedData.beforeHolders.map(h => {
                AddressService.normalizeAddress(h.address)
                    .then(address => h.address = address)

            }))])
        })
        .then(() => {
            let current = companyState.getMatchingHoldings({holders: normalizedData.afterHolders});
            if(!current.length){
                 throw new sails.config.exceptions.InvalidInverseOperation('Cannot find matching holding documentId: ' +data.documentId)
            }
            else if(current.length > 1 && session.active){
                // ambiguity resolving strategy
                if(!session.get('options')[session.get('index')]){
                    session.get('options')[session.get('index')] = {index: 0, keys: current.map(c => c.holdingId).sort()};
                }
                const obj = session.get('options')[session.get('index')]
                current = _.find(current, {holdingId: obj.keys[obj.index]});
            }
            else{
                current = current[0];
            }
            companyState.mutateHolders(current, normalizedData.beforeHolders);
            if(data.beforeName){
                current.dataValues.name =  data.beforeName;
            }
            const previousHolding = previousState.getMatchingHolding({holders: normalizedData.afterHolders});
            previousHolding.setTransaction(transaction);
            return previousHolding.save();
        })
        .then(() => {
            return transaction;
        });
};

export function performHoldingChange(data, companyState, previousState, effectiveDate){
    const transaction = Transaction.build({type: data.transactionType,  data: data, effectiveDate: effectiveDate});
     return companyState.dataValues.holdingList.buildNext()
        .then(holdingList => {
            companyState.dataValues.holdingList = holdingList;
            companyState.dataValues.h_list_id = null;
            return transaction.save()
        })
        .then(() => {
            let current = companyState.getMatchingHoldings({holdingId: data.holdingId, holders: data.beforeHolders});
            current = current[0];
            if(!current){
                 throw new sails.config.exceptions.InvalidInverseOperation('Cannot find matching holding documentId: ' +data.documentId)
            }
            if(data.afterName){
                current.dataValues.name =  data.afterName;
            }
            companyState.mutateHolders(current, data.afterHolders, transaction);
            return transaction;
        });
};

export const performInverseHolderChange = function(data, companyState, previousState, effectiveDate){
    const normalizedData = _.cloneDeep(data);
    const transaction = Transaction.build({type: data.transactionType,  data: data, effectiveDate: effectiveDate});
    return companyState.dataValues.holdingList.buildNext()
        .then(function(holdingList){
            companyState.dataValues.holdingList = holdingList;
            companyState.dataValues.h_list_id = null;
            return Promise.join(AddressService.normalizeAddress(data.afterHolder.address),
                        AddressService.normalizeAddress(data.beforeHolder.address))
        })
        .spread((afterAddress, beforeAddress) => {
            normalizedData.afterHolder.address = afterAddress;
            normalizedData.beforeHolder.address = beforeAddress;
            return companyState.replaceHolder(normalizedData.afterHolder, normalizedData.beforeHolder);
        })
        .then(function(){
            return transaction.save();
        })
        .then(function(){
            // find previousState person instance, attach mutating transaction
            const holder = previousState.getHolderBy(normalizedData.afterHolder);
            holder.setTransaction(transaction);
            return holder.save();
        })
        .catch((e)=>{
            sails.log.error(e);
            throw new sails.config.exceptions.InvalidInverseOperation('Cannot find holder, holder change, documentId: ' +data.documentId)
        });
};

export const performHolderChange = function(data, companyState, previousState, effectiveDate){
    const normalizedData = _.cloneDeep(data);
    const transaction = Transaction.build({type: data.transactionType,  data: data, effectiveDate: effectiveDate});
    return companyState.dataValues.holdingList.buildNext()
        .then(function(holdingList){
            companyState.dataValues.holdingList = holdingList;
            companyState.dataValues.h_list_id = null;
            return Promise.join(AddressService.normalizeAddress(data.afterHolder.address),
                            AddressService.normalizeAddress(data.beforeHolder.address))
        })
        .spread((afterAddress, beforeAddress) => {
            normalizedData.afterHolder.address = afterAddress;
            normalizedData.beforeHolder.address = beforeAddress;
            return transaction.save()
        })
        .then(function(){
            return companyState.replaceHolder(normalizedData.beforeHolder, normalizedData.afterHolder, transaction);
        })
        .then(function(){
            return transaction;
        })
        .catch((e)=>{
            sails.log.error(e);
            throw new sails.config.exceptions.InvalidOperation('Cannot find holder, holder change')
        });
};


export  function performInverseNewAllocation(data, companyState, previousState, effectiveDate){
    data = _.cloneDeep(data);
    return companyState.dataValues.holdingList.buildNext()
    .then(function(holdingList){
        companyState.dataValues.holdingList = holdingList;
        companyState.dataValues.h_list_id = null;
        let holding = companyState.getMatchingHolding({holders: data.holders, parcels: [{amount: data.amount, shareClass: data.shareClass}]});
        if(!data.shareClass){
            data.shareClass = _.find(holding.dataValues.parcels, p => data.amount === p.amount).shareClass;
        }

        companyState.combineUnallocatedParcels({amount: data.amount, shareClass: data.shareClass});

        if(!holding){
            // if fail, ignore company number
            sails.log.error('Could not find matching holding, trying with ignored companyNumber')
            holding = companyState.getMatchingHolding({holders: data.holders, parcels: [{amount: data.amount}]}, {ignoreCompanyNumber: true});

        }
        if(!holding){
            throw new sails.config.exceptions.InvalidInverseOperation('Cannot find holding, new allocation, documentId: ' +data.documentId)
        }
        let sum = _.sum(holding.parcels, (p) => {
            return p.amount;
        });
        if(sum !== data.amount){
            throw new sails.config.exceptions.InvalidInverseOperation('Allocation total does not match, new allocation, documentId: ' +data.documentId)
        }
        holdingList.dataValues.holdings = _.without(holdingList.dataValues.holdings, holding);
        const transaction = Transaction.build({type: data.transactionSubType || data.transactionType,  data: data, effectiveDate: effectiveDate});
        return transaction.save()
            .then((transaction) => {
                const prevHolding = previousState.getHoldingBy({holdingId: holding.holdingId});
                return prevHolding.setTransaction(transaction.id);
            })
            .then(() => {
                return transaction;
            });
    });

};

export function performInverseRemoveAllocation(data, companyState, previousState, effectiveDate){
    return companyState.dataValues.holdingList.buildNext()
    .then(function(holdingList){
        companyState.dataValues.holdingList = holdingList;
        companyState.dataValues.h_list_id = null;
        return CompanyState.populatePersonIds(data.holders)
    })
    .then(function(personData){
            const holding = Holding.buildDeep({holders: personData,
                parcels: [{amount: 0, shareClass: data.shareClass}]});
        companyState.dataValues.holdingList.dataValues.holdings.push(holding);
        return Transaction.build({type: data.transactionSubType || data.transactionType,  data: data, effectiveDate: effectiveDate});
    })
}


export function validateInverseNameChange(data, companyState,  effectiveDate){
    if(data.newCompanyName !== companyState.companyName){
        throw new sails.config.exceptions.InvalidInverseOperation('New company name does not match expected name, documentId: ' +data.documentId)
    }
    if(data.previousCompanyName === data.newCompanyName){
        throw new sails.config.exceptions.InvalidInverseOperation('Company names do not differ, documentId: ' +data.documentId)
    }
}

export const performInverseNameChange = Promise.method(function(data, companyState, previousState, effectiveDate){
    validateInverseNameChange(data, companyState);
    companyState.set('companyName', data.previousCompanyName);
    return companyState.validate()
        .then(function(errors){
            if(errors){
                return Promise.reject(errors);
            }
            return Transaction.build({type: data.transactionType,  data: data, effectiveDate: effectiveDate})
        });
});

export function validateNameChange(data, companyState,  effectiveDate){
    if(data.previousCompanyName !== companyState.companyName){
        throw new sails.config.exceptions.InvalidInverseOperation('Previous company name does not match expected name, documentId: ' +data.documentId)
    }
    if(data.previousCompanyName === data.newCompanyName){
        throw new sails.config.exceptions.InvalidInverseOperation('Company names do not differ, documentId: ' +data.documentId)
    }
}


export const performNameChange = Promise.method(function(data, nextState, previousState, effectiveDate){
    validateNameChange(data, nextState);
    nextState.set('companyName', data.newCompanyName);
    return nextState.validate()
        .then(function(errors){
            if(errors){
                return Promise.reject(errors);
            }
            return Transaction.build({type: data.transactionType,  data: data, effectiveDate: effectiveDate})
        })
});


export function validateInverseAddressChange(data, companyState, effectiveDate){
    return AddressService.normalizeAddress(data.newAddress)
    .then((newAddress) => {
        if(!AddressService.compareAddresses(newAddress, companyState[data.field])){
            throw new sails.config.exceptions.InvalidInverseOperation('New address does not match expected, documentId: ' +data.documentId)
        }
        if(['registeredCompanyAddress',
            'addressForShareRegister',
            'addressForService'].indexOf(data.field) === -1){
            throw new sails.config.exceptions.InvalidInverseOperation('Address field not valid, documentId: ' +data.documentId)
        }
    })
}

export function performInverseAddressChange(data, companyState, previousState, effectiveDate){
    return validateInverseAddressChange(data, companyState)
    .then(function(){
        return AddressService.normalizeAddress(data.previousAddress);
    })
    .then((previousAddress) => {
        companyState.set(data.field, previousAddress);
        return Transaction.build({type: data.transactionType,  data: data, effectiveDate: effectiveDate});
    });
};

export function validateAddressChange(data, companyState, effectiveDate){
    return AddressService.normalizeAddress(data.previousAddress)
    .then((previousAddress) => {
        if(!AddressService.compareAddresses(previousAddress, companyState[data.field])){
            throw new sails.config.exceptions.InvalidOperation('Previous address does not match expected')
        }
        if(['registeredCompanyAddress',
            'addressForShareRegister',
            'addressForService'].indexOf(data.field) === -1){
            throw new sails.config.exceptions.InvalidOperation('Address field not valid, documentId: ' +data.documentId)
        }
    })
}

export function performAddressChange(data, companyState, previousState, effectiveDate){
    return validateAddressChange(data, companyState)
    .then(function(){
        return AddressService.normalizeAddress(data.newAddress);
    })
    .then((newAddress) => {
        companyState.set(data.field, newAddress);
        return Transaction.build({type: data.transactionType,  data: data, effectiveDate: effectiveDate});
    })
};

export function performDetailsChange(data, companyState, previousState, effectiveDate){
    companyState.set(data.field, data.value);
    return Transaction.build({type: data.transactionType,  data: data, effectiveDate: effectiveDate});
};


export const validateInverseNewDirector = Promise.method(function(data, companyState){
    const director = _.find(companyState.dataValues.directorList.dataValues.directors, (d)=> {
        return d.person.isEqual(data, {skipAddress: true});
    })
    if(!director){
        throw new sails.config.exceptions.InvalidInverseOperation('Could not find expected new director, documentId: ' +data.documentId)
    }
});

export function performInverseNewDirector(data, companyState, previousState, effectiveDate){
    return validateInverseNewDirector(data, companyState)
    .then(function(){
        return companyState.dataValues.directorList.buildNext()
    })
    .then(function(dl){
        dl.dataValues.directors = _.reject(dl.dataValues.directors, (d) => {
            return d.person.isEqual(data, {skipAddress: true});
        });
        companyState.dataValues.directorList = dl;

        return Transaction.build({type: data.transactionType,  data: data, effectiveDate: effectiveDate});
    });
}

export function performInverseRemoveDirector(data, companyState, previousState, effectiveDate){
    return companyState.dataValues.directorList.buildNext()
    .then(function(dl){
        companyState.dataValues.directorList = dl;
        return CompanyState.findOrCreatePerson({name: data.name, address: data.address, personId: data.personId})
    })
    .then(person => {
        const director = Director.build({
            appointment: effectiveDate, personId: person.id})
        director.dataValues.person = person;
        companyState.dataValues.directorList.dataValues.directors.push(director);
        return Transaction.build({type: data.transactionType,  data: data, effectiveDate: effectiveDate})
    });
}

export function performInverseUpdateDirector(data, companyState, previousState, effectiveDate){
    // find them as a share holder?
    const transaction = Transaction.build({type: data.transactionSubType || data.transactionType,  data: data, effectiveDate: effectiveDate});
    return companyState.dataValues.directorList.buildNext()
        .then(function(dl){
            companyState.dataValues.directorList = dl;
            return transaction.save()
        })
        .then(() => {
            return Promise.join(AddressService.normalizeAddress(data.afterAddress), AddressService.normalizeAddress(data.beforeAddress))
        })
        .spread((afterAddress, beforeAddress) => {
            companyState.replaceDirector({name: data.afterName, address: afterAddress, personId: data.personId},
                                         {name: data.beforeName, address: beforeAddress, personId: data.personId});
            return _.find(previousState.dataValues.directorList.dataValues.directors, function(d, i){
                return d.person.isEqual({name: data.afterName, address: afterAddress});
            }).person.setTransaction(transaction)
        })
        .then(() => {
            return transaction;
        })
        .catch((e) => {
            throw new sails.config.exceptions.InvalidInverseOperation('Could not update director, documentId: ' +data.documentId);
        });

};

export const validateIssueUnallocated = Promise.method(function(data){
    if(!Number.isInteger(data.amount) || data.amount <= 0){
        throw new sails.config.exceptions.InvalidInverseOperation('Amount must be natural number ( n >=0 ), documentId: ' +data.documentId)
    }
    if(!Number.isSafeInteger(data.amount)){
        throw new sails.config.exceptions.InvalidInverseOperation('Unsafe number, documentId: ' +data.documentId)
    }
});

export function performIssueUnallocated(data, nextState, previousState, effectiveDate){
    return validateIssueUnallocated(data, nextState)
        .then(() => {
            const transaction = Transaction.build({type: Transaction.types.ISSUE, data: data, effectiveDate: effectiveDate})
            nextState.combineUnallocatedParcels({amount: data.amount, shareClass: data.shareClass});
            return transaction;
        })
}

export function validateAmend(data, companyState){
    if(!data.holdingId && !(data.holders && data.holders.length)){
        throw new sails.config.exceptions.InvalidInverseOperation('Holders required, documentId: ' +data.documentId)
    }
    const holding = companyState.getMatchingHolding({holders: data.holders, holdingId: data.holdingId});
    if(!holding){
        throw new sails.config.exceptions.InvalidInverseOperation('Matching Holding not found, documentId: ' +data.documentId)
    }
    const sum = _.sum(holding.dataValues.parcels, (p) => {
        if(!Number.isInteger(p.amount)){
            throw new sails.config.exceptions.InvalidInverseOperation('Amount is not valid integer, documentId: ' +data.documentId)
        }
        return p.amount;
    });
    if(data.amount && !Number.isInteger(data.amount)){
        throw new sails.config.exceptions.InvalidInverseOperation('Amount is not valid integer, documentId: ' +data.documentId)
    }
    if(!Number.isSafeInteger(sum)){
        throw new sails.config.exceptions.InvalidInverseOperation('Unsafe number, documentId: ' +data.documentId)
    }
    return Promise.resolve(holding);
}

export const performAmend = Promise.method(function(data, companyState, previousState, effectiveDate){
    let transaction, holding;
    return validateAmend(data, companyState)
        .then(() => {
            return companyState.dataValues.holdingList.buildNext()
        })
        .then(holdingList => {
            companyState.dataValues.holdingList = holdingList;
            companyState.dataValues.h_list_id = null;
            const difference = data.afterAmount - data.beforeAmount;
            const parcel = {amount: Math.abs(difference), shareClass: data.shareClass};
            const newHolding = {holders: data.holders, parcels: [parcel], holdingId: data.holdingId};
            const transactionType  = data.transactionType;
            transaction = Transaction.build({type: data.transactionSubType || transactionType,
                data: {...data, amount: parcel.amount}, effectiveDate: effectiveDate});


            if(difference < 0){
                companyState.combineUnallocatedParcels(parcel);
                companyState.subtractHoldings([newHolding], null, transaction);
            }
            else{
                companyState.subtractUnallocatedParcels(parcel);
                companyState.combineHoldings([newHolding], null, transaction);
            }
            return transaction;
        })
});

export function performRemoveAllocation(data, nextState, companyState, effectiveDate){
    return nextState.dataValues.holdingList.buildNext()
    .then(function(holdingList){
        nextState.dataValues.holdingList = holdingList;
        nextState.dataValues.h_list_id = null;
        const holding = nextState.getMatchingHolding({holders: data.holders, holdingId: data.holdingId});
        if(!holding){
            throw new sails.config.exceptions.InvalidOperation('Could not find holding, documentId: ' +data.documentId)
        }
        if(holding.hasNonEmptyParcels()){
            throw new sails.config.exceptions.InvalidOperation('Holding has non empty parcels, documentId: ' +data.documentId)
        }
        holdingList.dataValues.holdings = _.without(holdingList.dataValues.holdings, holding);
        return Transaction.build({type: data.transactionType,  data: data, effectiveDate: effectiveDate});
    })
}

export  function performNewAllocation(data, nextState, companyState, effectiveDate){
    return nextState.dataValues.holdingList.buildNext()
    .then(function(holdingList){
        nextState.dataValues.holdingList = holdingList;
        nextState.dataValues.h_list_id = null;
        return CompanyState.populatePersonIds(data.holders)
    })
    .then(function(personData){
        const transaction = Transaction.build({type: data.transactionType,  data: data, effectiveDate: effectiveDate});
        const holding = Holding.buildDeep({holders: personData, transaction: transaction, name: data.name,
            parcels: []}); // [{amount: 0, shareClass: data.shareClass}]});
        nextState.dataValues.holdingList.dataValues.holdings.push(holding);
        return transaction;
    });

};


export  function performApplyShareClass(data, nextState, companyState, effectiveDate){
    return nextState.dataValues.holdingList.buildNext()
    .then(function(holdingList){
        nextState.dataValues.holdingList = holdingList;
        nextState.dataValues.h_list_id = null;
        const index = _.findIndex(holdingList.dataValues.holdings, h => {
            return h.dataValues.holdingId === data.holdingId;
        });
        if(index < 0){
            throw new sails.config.exceptions.InvalidOperation('Cannot find holding to apply share class to, documentId: ' +data.documentId)
        }
        const newHolding = holdingList.dataValues.holdings[index].buildNext();
        holdingList.dataValues.holdings[index] = newHolding;
        newHolding.dataValues.parcels = newHolding.dataValues.parcels.map(p => {
            return p.replace({shareClass: data.shareClass});
        });
        return Transaction.build({type: data.transactionType,  data: data, effectiveDate: effectiveDate});
    });
};


export const validateRemoveDirector = Promise.method(function(data, companyState){
    const director = _.find(companyState.dataValues.directorList.dataValues.directors, (d)=> {
        return d.person.isEqual(data, {skipAddress: true});
    })
    if(!director){
        throw new sails.config.exceptions.InvalidInverseOperation('Could not find expected new director, documentId: ' +data.documentId)
    }
});

export function performRemoveDirector(data, companyState, previousState, effectiveDate){
    return validateRemoveDirector(data, companyState)
    .then(function(){
        return companyState.dataValues.directorList.buildNext()
    })
    .then(function(dl){
        dl.dataValues.directors = _.reject(dl.dataValues.directors, (d) => {
            return d.person.isEqual(data, {skipAddress: true});
        });
        companyState.dataValues.directorList = dl;
        return Transaction.build({type: data.transactionType,  data: data, effectiveDate: effectiveDate});
    });
}

export function performNewDirector(data, companyState, previousState, effectiveDate){
    // find them as a share holder? and vice versa?
    return companyState.dataValues.directorList.buildNext()
    .then(function(dl){
        companyState.dataValues.directorList = dl;
        return CompanyState.populatePersonIds([{name: data.name, address: address, personId: data.personId}])
    })
    .then(person => {
        const director = Director.build({
            appointment: effectiveDate, personId: person.id});
        director.dataValues.person = person;
        companyState.dataValues.directorList.dataValues.directors.push(director);
        return Transaction.build({type: data.transactionType,  data: data, effectiveDate: effectiveDate})
    });
}

export function performUpdateDirector(data, companyState, previousState, effectiveDate){
    // find them as a share holder?
    const transaction = Transaction.build({type: data.transactionSubType || data.transactionType,  data: data, effectiveDate: effectiveDate});
    return companyState.dataValues.directorList.buildNext()
        .then(function(dl){
            companyState.dataValues.directorList = dl;
            return transaction.save()
        })
        .then(() => {
            return Promise.join(AddressService.normalizeAddress(data.afterAddress), AddressService.normalizeAddress(data.beforeAddress))
        })
        .spread((afterAddress, beforeAddress) => {
            companyState.replaceDirector({name: data.beforeName, address: beforeAddress, personId: data.personId},
                                         {name: data.afterName, address: afterAddress, personId: data.personId}, transaction);
            return transaction;
        })
        .catch((e) => {
            throw new sails.config.exceptions.InvalidInverseOperation('Could not update director, documentId: ' +data.documentId);
        });
};


/**
    Seed is a special cause, it doesn't care about previousState
*/
export function performSeed(data, companyState, previousState, effectiveDate){

}

export function removeDocuments(state, actions){
    const ids = _.filter(_.map(actions, 'sourceUrl'))
    if(ids.length){
        return state.getDocList()
            .then(function(dl){
                return dl.buildNext();
            })
            .then(function(dl){
                dl.dataValues.documents = dl.dataValues.documents.filter(d => {
                    return ids.indexOf(d.sourceUrl) >= 0;
                });
                return dl.save()
            })
            .then(function(dl){
                state.set('doc_list_id', dl.id)
                return state;
            })
    }
    return state;
}

export function removeActions(state, actionSet){
    let currentActions = [];
    return state.getHistoricalActions()
        .then(function(hA){
            if(!hA){
                return Actions.build({})
            }
            currentActions = hA.dataValues.actions;
            return hA.buildNext();
        })
        .then(function(hA){
            hA.dataValues.actions = _.reject(currentActions, {id: actionSet.id});
            return hA.save()
        })
        .then(function(hA){
            state.set('historical_action_id', hA.id)
            return state;
        })
}


export function performInverseTransaction(data, company, rootState){
    const PERFORM_ACTION_MAP = {
        [Transaction.types.AMEND]:  TransactionService.performInverseAmend,
        [Transaction.types.TRANSFER]:  TransactionService.performInverseAmend,
        [Transaction.types.HOLDING_CHANGE]:  TransactionService.performInverseHoldingChange,
        [Transaction.types.HOLDER_CHANGE]:  TransactionService.performInverseHolderChange,
        [Transaction.types.ISSUE_UNALLOCATED]:  TransactionService.performInverseIssueUnallocated,
        [Transaction.types.CONVERSION]:  TransactionService.performInverseIssueUnallocated,
        [Transaction.types.ACQUISITION]:  TransactionService.performInverseAcquisition,
        [Transaction.types.PURCHASE]:  TransactionService.performInverseAcquisition,
        [Transaction.types.NEW_ALLOCATION]:  TransactionService.performInverseNewAllocation,
        [Transaction.types.REMOVE_ALLOCATION]: TransactionService.performInverseRemoveAllocation,
        [Transaction.types.NAME_CHANGE]: TransactionService.performInverseNameChange,
        [Transaction.types.ADDRESS_CHANGE]: TransactionService.performInverseAddressChange,
        [Transaction.types.DETAIL_CHANGE]: TransactionService.performInverseDetailChange,
        [Transaction.types.NEW_DIRECTOR]: TransactionService.performInverseNewDirector,
        [Transaction.types.REMOVE_DIRECTOR]: TransactionService.performInverseRemoveDirector,
        [Transaction.types.UPDATE_DIRECTOR]: TransactionService.performInverseUpdateDirector,
        [Transaction.types.ANNUAL_RETURN]: TransactionService.validateAnnualReturn
    };
    if(!data.actions){
        return Promise.resolve(rootState);
    }
    let prevState, currentRoot, transactions;
    return (rootState ? Promise.resolve(rootState) : company.getRootCompanyState())
        .then(function(_rootState){
            currentRoot = _rootState;
            return currentRoot.buildPrevious({transaction: null, transactionId: null});
        })
        .then(function(_prevState){
            prevState = _prevState;
            prevState.dataValues.transactionId = null;
            prevState.dataValues.transaction = null;
            return Promise.reduce(data.actions, function(arr, action){
                sails.log.info('Performing action: ', JSON.stringify(action, null, 4), data.documentId);
                let result;
                const method = action.transactionMethod || action.transactionType;
                if(session.get('options')){
                    session.set('index', session.get('index') + 1);
                }
                if(PERFORM_ACTION_MAP[method]){
                    result = PERFORM_ACTION_MAP[method]({
                        ...action, documentId: data.documentId
                    }, prevState, currentRoot, data.effectiveDate);
                }
                if(result){
                    return result
                    .then(function(r){
                        arr.push(r);
                        return arr;
                    })
                }
                return arr;
            }, []);

        })
        .then(function(transactions){
            const tran = Transaction.buildDeep({
                    type: data.transactionType || Transaction.types.COMPOUND,
                    data: _.omit(data, 'actions', 'transactionType', 'effectiveDate'),
                    effectiveDate: data.effectiveDate,
            });
            tran.dataValues.childTransactions = _.filter(transactions);
            return tran.save();
        })
        .then(function(transaction){
            return currentRoot.setTransaction(transaction.id);
        })
        .then(function(){
            return removeDocuments(prevState, data.actions);
        })
        .then(function(){
            return removeActions(prevState, data);
        })
        .then(function(currentRoot){
            return prevState.save();
        })
        .then(function(_prevState){
            //sails.log.silly('Current state', JSON.stringify(prevState, null, 4));
            sails.log.info('Current state', JSON.stringify(prevState.directorList, null ,4));
            //sails.log.info('Current state', JSON.stringify(prevState.holdingList.holdings));
            return currentRoot.setPreviousCompanyState(_prevState);
        })
         .then(function(){
            return prevState;
         })
}

export function performInverseAll(data, company, state){
    // Loop though data
    // If an exception is found, rollback, and increment permutation for
    // ambigious options.  give up after completion of breadth first search
    // TODO, switch to depth first
    console.time('transactions');
    const options = {};
    function next(){
        state = null;
        // breadth first search through options
        return _.find(options, option => {
            if(option){
                option.index++;
                if(option.index >= option.keys.length){
                    option.index = 0;
                    return false;
                }
                return true;
            }
        });
    }

    function loop(){
        // transaction is not bound to cls ns
        return sequelize.transaction(function(t){
            return new Promise((resolve, reject) => {
                session.run(() => {
                    session.set('index', 0);
                    session.set('options', options);
                    return Promise.each(data, function(doc){
                        return TransactionService.performInverseTransaction(doc, company, state)
                            .then(_state => {
                                state = _state;
                            });
                    })
                    .then(resolve)
                    .catch(reject)
                });
            });
        })

        .catch(e => {
            if(!next()){
                throw e;
            }
            else{
                return loop();
            }
        });
    }

    return loop()
        .then(function(){
            console.timeEnd('transactions');
        });


}


export function performTransaction(data, company, companyState){
    const PERFORM_ACTION_MAP = {
        [Transaction.types.ISSUE_UNALLOCATED]:  TransactionService.performIssueUnallocated,
        [Transaction.types.AMEND]:  TransactionService.performAmend,
        [Transaction.types.NAME_CHANGE]: TransactionService.performNameChange,
        [Transaction.types.DETAILS]: TransactionService.performDetailsChange,
        [Transaction.types.ADDRESS_CHANGE]: TransactionService.performAddressChange,
        [Transaction.types.HOLDING_CHANGE]:  TransactionService.performHoldingChange,
        [Transaction.types.HOLDER_CHANGE]:  TransactionService.performHolderChange,
        [Transaction.types.NEW_ALLOCATION]:  TransactionService.performNewAllocation,
        [Transaction.types.REMOVE_ALLOCATION]: TransactionService.performRemoveAllocation,
        [Transaction.types.NEW_DIRECTOR]: TransactionService.performNewDirector,
        [Transaction.types.REMOVE_DIRECTOR]: TransactionService.performRemoveDirector,
        [Transaction.types.UPDATE_DIRECTOR]: TransactionService.performUpdateDirector,
        [Transaction.types.APPLY_SHARE_CLASS]: TransactionService.performApplyShareClass,
    };
    if(!data.actions){
        return Promise.resolve(companyState);
    }
    if(data.transactionType === Transaction.types.ANNUAL_RETURN){
        return (companyState ? Promise.resolve(companyState) : company.getCurrentCompanyState())
        .then(function(_state){
            return PERFORM_ACTION_MAP[data.transactionType]({
                        ...data.actions[0], documentId: data.documentId
                    }, _state);
        })
    }
    let nextState, current, transactions;
    return (companyState ? Promise.resolve(companyState) : company.getCurrentCompanyState())
        .then(function(_state){
            current = _state;
            return current.buildNext({previousCompanyStateId: current.dataValues.id});
        })
        .then(function(_nextState){
            nextState = _nextState;
            // TODO, serviously consider having EACH action create a persistant graph
            // OR, force each transaction set to be pre grouped
            return Promise.reduce(data.actions, function(arr, action){
                sails.log.info('Performing action: ', JSON.stringify(action, null, 4), data.documentId);
                let result;
                const method = action.transactionMethod || action.transactionType;
                if(PERFORM_ACTION_MAP[method]){
                    result = PERFORM_ACTION_MAP[method]({
                        ...action, documentId: data.documentId
                    }, nextState, current, data.effectiveDate || new Date);
                }
                if(result){
                    return result.then(function(r){
                        arr.push(r);
                        return arr;
                    });
                }
                return arr;
            }, [])

        })
        .then(function(transactions){
            const tran = Transaction.buildDeep({
                    type: data.transactionType || Transaction.types.COMPOUND,
                    data: _.omit(data, 'actions', 'transactionType', 'effectiveDate'),
                    effectiveDate: data.effectiveDate,
            });
            tran.dataValues.childTransactions = _.filter(transactions);
            return tran.save();
        })
        .then(function(transaction){
            nextState.dataValues.transaction = transaction;
            return nextState.getHistoricalActions();
        })
        .then(function(hA){
            hA = hA ? hA.buildNext() : Actions.build({actions: []});
            hA.dataValues.actions.unshift(data);
            return hA.save();
        })
        .then(function(hA){
            nextState.set('historical_action_id', hA.id);
            return nextState.save();
        })
        .then(function(){
            return company.setCurrentCompanyState(nextState);
        })
        .then(function(){
            return company.save();
        })
        .then(function(){
            return nextState;
        })
}


export function performAll(data, company, state){
    return Promise.each(data, function(doc){
        return TransactionService.performTransaction(doc, company, state)
            .then(_state => {
                state = _state;
            });
    })
    .then(() => {
        return state;
    })
}


export function createImplicitTransactions(state, effectiveDate){
    const actions = state.dataValues.holdingList.dataValues.holdings.reduce((acc, holding) => {
        if(!holding.hasNonEmptyParcels()){
            acc.push({
                transactionType: Transaction.types.REMOVE_ALLOCATION,
                holdingId: holding.holdingId
            });
        }
        return acc;
    }, []);
    if(actions.length){
        return [{
            transactionType: Transaction.types.COMPOUND_REMOVALS,
            actions: actions,
            effectiveDate: effectiveDate
        }]
    }
}
