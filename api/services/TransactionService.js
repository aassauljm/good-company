const _ = require('lodash');
const moment = require('moment');
const Promise = require('bluebird');

export function validateAnnualReturn(data, companyState, effectiveDate){
    const state = companyState.toJSON();
    return companyState.stats()
        .then((stats) => {
            if(stats.totalShares != data.totalShares){
                throw new sails.config.exceptions.InvalidInverseOperation('Total shares do not match, documentId: ' +documentId);
            }
            // extract address and name for directors
            const currentDirectors = JSON.stringify(_.sortBy(_.map(state.directors, (d)=>_.pick(d.person, 'name'/*, 'address'*/)), 'name'));
            const expectedDirectors = JSON.stringify(_.sortBy(_.map(data.directors, (d)=>_.pick(d, 'name'/*, 'address'*/)), 'name'));

            const holdingToString = (holdings) =>{
                return _.sortByAll(holdings.map((holding)=>{
                    return  {holders: _.sortBy(holding.holders.map((p)=>_.pick(p, 'name')), 'name'), parcels: holding.parcels.map((p)=>_.pick(p, 'amount'))};
                }), (holding) => -holding.parcels[0].amount, (holding) => holding.holders[0].name);

            }

            const currentHoldings = holdingToString(state.holdings)
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
        });
};

export function validateInverseAmend(amend, companyState){
    const holding = companyState.getMatchingHolding(amend.afterHolders, [{amount: amend.afterAmount}]);
    if(!holding){
        throw new sails.config.exceptions.InvalidInverseOperation('Matching Holder not found, documentId: ' +amend.documentId)
    }
    const sum = _.sum(holding.dataValues.parcels, (p) =>{
        return p.amount;
    });
    if(!Number.isSafeInteger(sum)){
        throw new sails.config.exceptions.InvalidInverseOperation('Unsafe number, documentId: ' +amend.documentId)
    }
    if(amend.beforeAmount < 0 || amend.afterAmount < 0){
        throw new sails.config.exceptions.InvalidInverseOperation('Before and after amounts must be natural numbers ( n >=0 ), documentId: ' +data.documentId)
    }
    if(amend.afterAmount && (sum !== amend.afterAmount)){
        throw new sails.config.exceptions.InvalidInverseOperation('After amount does not match, amend, documentId: ' +amend.documentId)
    }
    return Promise.resolve(holding);
}



export function performInverseIssue(data, companyState, previousState, effectiveDate){
    return validateInverseIssue(data, companyState)
        .then(() => {
            const transaction = Transaction.build({type: data.transactionSubType || data.transactionType, data: data, effectiveDate: effectiveDate})
            companyState.subtractUnallocatedParcels({amount: data.amount});
            return transaction;
        })
    // In an issue we remove from unallocatedShares
}

export function performInverseConversion(data, companyState, previousState, effectiveDate){
    return validateInverseIssue(data, companyState)
        .then(() => {
            const transaction = Transaction.build({type: data.transactionSubType || data.transactionType, data: data, effectiveDate: effectiveDate})
            companyState.subtractUnallocatedParcels({amount: data.amount});
            return transaction;
        })
    // In an issue we remove from unallocatedShares
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

export const performInverseAmend = Promise.method(function(data, companyState, previousState, effectiveDate){
    let transaction, holding;
    return validateInverseAmend(data, companyState)
        .then((_holding) =>{
            holding = _holding;
            let difference = data.afterAmount - data.beforeAmount;
            let parcel = {amount: Math.abs(difference)};
            let newHolding = {holders: data.afterHolders, parcels: [parcel]};
            let transactionType  = data.transactionSubType || data.transactionType;
            if(difference < 0){
                companyState.subtractUnallocatedParcels(parcel);
                companyState.combineHoldings([newHolding], [{amount: data.afterAmount}]);
            }
            else{
                companyState.combineUnallocatedParcels(parcel);
                companyState.subtractHoldings([newHolding], [{amount: data.afterAmount}]);
            }
            transaction = Transaction.build({type: data.transactionSubType || transactionType,  data: data, effectiveDate: effectiveDate});
            return transaction.save();
        })
        .then(() => {
            const prevHolding = previousState.getHoldingBy({holdingId: holding.holdingId});
            return prevHolding.setTransaction(transaction.id);
        })
        .then(() => {
            return transaction;
        });
});

export function performInverseHoldingChange(data, companyState, previousState, effectiveDate){
    const current = companyState.getMatchingHolding(data.afterHolders);
    const transaction = Transaction.build({type: data.transactionType,  data: data, effectiveDate: effectiveDate});
    return transaction.save()
        .then(() => {
            if(!current){
                 throw new sails.config.exceptions.InvalidInverseOperation('Cannot find matching holding documentId: ' +data.documentId)
            }
            companyState.mutateHolders(current, data.beforeHolders);
            const previousHolding = previousState.getMatchingHolding(data.afterHolders);
            previousHolding.setTransaction(transaction);
            return previousHolding.save();
        })
        .then(() => {
            return transaction;
        });
};

export const performInverseHolderChange = function(data, companyState, previousState, effectiveDate){
    const normalizedData = _.cloneDeep(data);
    const transaction = Transaction.build({type: data.transactionType,  data: data, effectiveDate: effectiveDate});
    return Promise.join(AddressService.normalizeAddress(data.afterHolder.address),
                        AddressService.normalizeAddress(data.beforeHolder.address))
        .spread((afterAddress, beforeAddress) => {
            normalizedData.afterHolder.address = afterAddress;
            normalizedData.beforeHolder.address = beforeAddress;
            companyState.replaceHolder(normalizedData.afterHolder, normalizedData.beforeHolder);
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

export const performInverseNewAllocation = Promise.method(function(data, companyState, previousState, effectiveDate){
    companyState.combineUnallocatedParcels({amount: data.amount});
    const holding = companyState.getMatchingHolding(data.holders, [{amount: data.amount}]);
    if(!holding){
        throw new sails.config.exceptions.InvalidInverseOperation('Cannot find holding, new allocation, documentId: ' +data.documentId)
    }
    let sum = _.sum(holding.parcels, (p) => {
        return p.amount;
    });
    if(sum !== data.amount){
        throw new sails.config.exceptions.InvalidInverseOperation('Allocation total does not match, new allocation, documentId: ' +data.documentId)
    }
    companyState.dataValues.holdings = _.without(companyState.dataValues.holdings, holding);
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

export function performInverseRemoveAllocation(data, companyState, previousState, effectiveDate){
    // replace holders with look up
    return CompanyState.populatePersonIds(data.holders)
        .then(function(personData){
        const holding = Holding.buildDeep({holders: personData,
            parcels: [{amount: 0, shareClass: data.shareClass}]});

        //holding.dataValues.holders = holding.dataValues.holders.map((h) => {
        //    return previousState.getHolderBy(h.get()) || h;
        //});
        companyState.dataValues.holdings.push(holding);
        return Transaction.build({type: data.transactionSubType || data.transactionType,  data: data, effectiveDate: effectiveDate});
    });
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

export function validateInverseAddressChange(data, companyState, effectiveDate){
    return AddressService.normalizeAddress(data.newAddress)
    .then((newAddress) => {
        if(!AddressService.compareAddresses(newAddress, companyState[data.field])){
            throw new sails.config.exceptions.InvalidInverseOperation('New address does not match expected, documentId: ' +data.documentId)
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

export function validateNewDirector(data, companyState){
    const director = _.find(companyState.dataValues.directors, (d)=> {
        return d.person.name === data.name ; /*&& d.person.address === data.address */;
    })
    if(!director){
        throw new sails.config.exceptions.InvalidInverseOperation('Could not find expected new director, documentId: ' +data.documentId)
    }
}

export const performNewDirector = Promise.method(function(data, companyState, previousState, effectiveDate){
    validateNewDirector(data, companyState);
    companyState.dataValues.directors = _.reject(companyState.dataValues.directors, (d) => {
        return d.person.name === data.name /*&&  && d.person.address == data.address */;
    });
    return Promise.resolve(Transaction.build({type: data.transactionType,  data: data, effectiveDate: effectiveDate}))
});

export function performRemoveDirector(data, companyState, previousState, effectiveDate){
    // find them as a share holder?
    return AddressService.normalizeAddress(data.address)
        .then(address => {
            companyState.dataValues.directors.push(Director.build({
            appointment: effectiveDate, person: {name: data.name, address: address}},
            {include: [{model: Person, as: 'person'}]}));
        return Transaction.build({type: data.transactionType,  data: data, effectiveDate: effectiveDate})
    });
}

export function performUpdateDirector(data, companyState, previousState, effectiveDate){
    // find them as a share holder?
    const transaction = Transaction.build({type: data.transactionSubType || data.transactionType,  data: data, effectiveDate: effectiveDate});
    return transaction.save()
        .then(() => {
            return Promise.join(AddressService.normalizeAddress(data.afterAddress), AddressService.normalizeAddress(data.beforeAddress))
        })
        .spread((afterAddress, beforeAddress) => {
            companyState.replaceDirector({name: data.afterName, address: afterAddress}, {name: data.beforeName, address: beforeAddress});
            return _.find(previousState.dataValues.directors, function(d, i){
                return d.person.isEqual({name: data.afterName, address: afterAddress});
            }).person.setTransaction(transaction)
        })
        .then(() => {
            return transaction;
        })
        .catch(() => {
            sails.log.error(JSON.stringify(previousState.toJSON().directors, null, 4));
            throw new sails.config.exceptions.InvalidInverseOperation('Could not update director, documentId: ' +data.documentId);
        });

};

/**
    Seed is a special cause, it doesn't care about previousState
*/
export function performSeed(data, companyState, previousState, effectiveDate){

}


export function performInverseTransaction(data, company){
    const PERFORM_ACTION_MAP = {
        [Transaction.types.AMEND]:  TransactionService.performInverseAmend,
        [Transaction.types.TRANSFER]:  TransactionService.performInverseAmend,
        [Transaction.types.ISSUE_TO]:  TransactionService.performInverseAmend,
        [Transaction.types.HOLDING_CHANGE]:  TransactionService.performInverseHoldingChange,
        [Transaction.types.HOLDER_CHANGE]:  TransactionService.performInverseHolderChange,
        [Transaction.types.ISSUE]:  TransactionService.performInverseIssue,
        [Transaction.types.CONVERSION]:  TransactionService.performInverseConversion,
        [Transaction.types.NEW_ALLOCATION]:  TransactionService.performInverseNewAllocation,
        [Transaction.types.REMOVE_ALLOCATION]: TransactionService.performInverseRemoveAllocation,
        [Transaction.types.NAME_CHANGE]: TransactionService.performInverseNameChange,
        [Transaction.types.ADDRESS_CHANGE]: TransactionService.performInverseAddressChange,
        [Transaction.types.NEW_DIRECTOR]: TransactionService.performNewDirector,
        [Transaction.types.REMOVE_DIRECTOR]: TransactionService.performRemoveDirector,
        [Transaction.types.UPDATE_DIRECTOR]: TransactionService.performUpdateDirector,
        [Transaction.types.ANNUAL_RETURN]: TransactionService.validateAnnualReturn
    };
    if(!data.actions){
        return;
    }
    let nextState, currentRoot, transactions;
    return company.getRootCompanyState()
        .then(function(_rootState){
            currentRoot = _rootState;
            return currentRoot.buildPrevious({transaction: null, transactionId: null});
        })
        .then(function(_nextState){
            nextState = _nextState;
            nextState.dataValues.transactionId = null;
            nextState.dataValues.transaction = null;
            return Promise.reduce(data.actions, function(arr, action){
                sails.log.verbose('Performing action: ', JSON.stringify(action, null, 4), data.documentId);
                let result;
                if(PERFORM_ACTION_MAP[action.transactionType]){
                    result = PERFORM_ACTION_MAP[action.transactionType]({
                        ...action, documentId: data.documentId
                    }, nextState, currentRoot, data.effectiveDate);
                    sails.log.verbose(' Immediate state', JSON.stringify(nextState, null, 4))
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
            return currentRoot.setTransaction(transaction.id);
        })
        .then(function(currentRoot){
            sails.log.verbose('Current state', JSON.stringify(nextState, null, 4))
            return nextState.save();
        })
        .then(function(_nextState){
            return currentRoot.setPreviousCompanyState(_nextState);
        })
}