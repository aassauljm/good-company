const _ = require('lodash');
const moment = require('moment');
const Promise = require('bluebird');

export function validateAnnualReturn(data, companyState, effectiveDate){
    const state = companyState.toJSON();
    return companyState.stats()
        .then((stats) => {
            if(stats.totalShares != data.totalShares){
                sails.log.error('stats: ', stats, data.totalShares)
                throw new sails.config.exceptions.InvalidInverseOperation('Total shares do not match, documentId: ' +data.documentId);
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
        })
        /*.catch(() => {
            sails.log.error('FAILED annual return validation')
        })*/
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
            const transaction = Transaction.build({type: data.transactionSubType || data.transactionType, data: data, effectiveDate: effectiveDate})
            companyState.subtractUnallocatedParcels({amount: data.amount, shareClass: data.shareClass});
            return transaction;
        })
}


export function performInverseAcquisition(data, companyState, previousState, effectiveDate){
    return validateInverseAcquistion(data, companyState)
        .then(() => {
            const transaction = Transaction.build({type: data.transactionSubType || data.transactionType, data: data, effectiveDate: effectiveDate})
            companyState.combineUnallocatedParcels({amount: data.amount});
            return transaction;
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
                companyState.combineHoldings([newHolding], [{amount: data.afterAmount, shareClass: data.shareClass}]);
            }
            else{
                companyState.combineUnallocatedParcels(parcel);
                companyState.subtractHoldings([newHolding], [{amount: data.afterAmount, shareClass: data.shareClass}]);
            }
            const current = companyState.getMatchingHolding(data.afterHolders)

            // If holders have changed too
            if(!current.holdersMatch({holders: data.beforeHolders})){
                companyState.mutateHolders(current, data.beforeHolders);
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

export function performHoldingChange(data, companyState, previousState, effectiveDate){
    const current = companyState.getMatchingHolding(data.beforeHolders);
    const transaction = Transaction.build({type: data.transactionType,  data: data, effectiveDate: effectiveDate});
    return transaction.save()
        .then(() => {
            if(!current){
                 throw new sails.config.exceptions.InvalidInverseOperation('Cannot find matching holding documentId: ' +data.documentId)
            }
            companyState.mutateHolders(current, data.afterHolders, transaction);
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
    let holding = companyState.getMatchingHolding(data.holders, [{amount: data.amount}]);
    if(!holding){
        // if fail, ignore company number
        sails.log.error('Could not find matching holding, trying with ignored companyNumber')
        holding = companyState.getMatchingHolding(data.holders, [{amount: data.amount}], true);

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


export function validateInverseNewDirector(data, companyState){
    const director = _.find(companyState.dataValues.directors, (d)=> {
        return d.person.name === data.name ; /*&& d.person.address === data.address */;
    })
    if(!director){
        throw new sails.config.exceptions.InvalidInverseOperation('Could not find expected new director, documentId: ' +data.documentId)
    }
}

export const performInverseNewDirector = Promise.method(function(data, companyState, previousState, effectiveDate){
    validateInverseNewDirector(data, companyState);
    companyState.dataValues.directors = _.reject(companyState.dataValues.directors, (d) => {
        return d.person.name === data.name /*&&  && d.person.address == data.address */;
    });
    return Promise.resolve(Transaction.build({type: data.transactionType,  data: data, effectiveDate: effectiveDate}))
});

export function performInverseRemoveDirector(data, companyState, previousState, effectiveDate){
    // find them as a share holder?
    return AddressService.normalizeAddress(data.address)
        .then(address => {
            companyState.dataValues.directors.push(Director.build({
            appointment: effectiveDate, person: {name: data.name, address: address}},
            {include: [{model: Person, as: 'person'}]}));
        return Transaction.build({type: data.transactionType,  data: data, effectiveDate: effectiveDate})
    });
}

export function performInverseUpdateDirector(data, companyState, previousState, effectiveDate){
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



function validateIssue(data){
    const newHoldings = data.holdings;
    if (!newHoldings || !newHoldings.length) {
        throw new sails.config.exceptions.ValidationException('Holdings are required');
    }
    newHoldings.forEach(function(holding){
        if(!holding.holders || !holding.holders.length){
            throw new sails.config.exceptions.ValidationException('Holders are required');
        }
        if(!holding.parcels || !holding.parcels.length){
            throw new sails.config.exceptions.ValidationException('Parcels are required');
        }
        holding.parcels.forEach(function(parcel){
            if(parcel.amount < 1)
                throw new sails.config.exceptions.ValidationException('Parcels amounts must be positve');
        });
    });
}

export function performIssueUnallocated(data, nextState, previousState, effectiveDate){
    return validateIssue(data, companyState)
        .then(() => {
            const transaction = Transaction.build({type: Transaction.types.ISSUE, data: data, effectiveDate: effectiveDate})
            companyState.combineUnallocatedParcels({amount: data.amount, shareClass: data.shareClass});
            return transaction;
        })
    // In an issue we remove from unallocatedShares
}


export const performAmend = Promise.method(function(data, companyState, previousState, effectiveDate){
    let transaction, holding;
    return validateInverseAmend(data, companyState)
        .then((_holding) =>{
            holding = _holding;
            let difference = data.afterAmount - data.beforeAmount;
            let parcel = {amount: Math.abs(difference)};
            let newHolding = {holders: data.afterHolders, parcels: [parcel]};
            let transactionType  = data.transactionSubType || data.transactionType;
            transaction = Transaction.build({type: data.transactionSubType || transactionType,  data: data, effectiveDate: effectiveDate});
            if(difference < 0){
                companyState.subtractUnallocatedParcels(parcel);
                companyState.combineHoldings([newHolding], [{amount: data.afterAmount}]);
            }
            else{
                companyState.combineUnallocatedParcels(parcel);
                companyState.subtractHoldings([newHolding], [{amount: data.afterAmount}]);
            }
            const current = companyState.getMatchingHolding(data.afterHolders)

            // If holders have changed too
            if(!current.holdersMatch({holders: data.beforeHolders})){
                companyState.mutateHolders(current, data.beforeHolders);
            }
        })
        .then(() => {
            return transaction;
        });
});

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
        [Transaction.types.ISSUE_UNALLOCATED]:  TransactionService.performInverseIssueUnallocated,
        [Transaction.types.CONVERSION]:  TransactionService.performInverseIssueUnallocated,
        [Transaction.types.ACQUISITION]:  TransactionService.performInverseAcquisition,
        [Transaction.types.NEW_ALLOCATION]:  TransactionService.performInverseNewAllocation,
        [Transaction.types.REMOVE_ALLOCATION]: TransactionService.performInverseRemoveAllocation,
        [Transaction.types.NAME_CHANGE]: TransactionService.performInverseNameChange,
        [Transaction.types.ADDRESS_CHANGE]: TransactionService.performInverseAddressChange,
        [Transaction.types.NEW_DIRECTOR]: TransactionService.performInverseNewDirector,
        [Transaction.types.REMOVE_DIRECTOR]: TransactionService.performInverseRemoveDirector,
        [Transaction.types.UPDATE_DIRECTOR]: TransactionService.performInverseUpdateDirector,
        [Transaction.types.ANNUAL_RETURN]: TransactionService.validateAnnualReturn
    };
    if(!data.actions){
        return;
    }
    let prevState, currentRoot, transactions;
    return company.getRootCompanyState()
        .then(function(_rootState){
            currentRoot = _rootState;
            return currentRoot.buildPrevious({transaction: null, transactionId: null});
        })
        .then(function(_prevState){
            prevState = _prevState;
            prevState.dataValues.transactionId = null;
            prevState.dataValues.transaction = null;
            return Promise.reduce(data.actions, function(arr, action){
                sails.log.verbose('Performing action: ', JSON.stringify(action, null, 4), data.documentId);
                let result;
                if(PERFORM_ACTION_MAP[action.transactionType]){
                    result = PERFORM_ACTION_MAP[action.transactionType]({
                        ...action, documentId: data.documentId
                    }, prevState, currentRoot, data.effectiveDate);
                    //sails.log.verbose(' Immediate state', JSON.stringify(prevState, null, 4))
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
            return prevState.save();
        })
        .then(function(_prevState){
            sails.log.verbose('Current state', JSON.stringify(prevState, null, 4));
            return currentRoot.setPreviousCompanyState(_prevState);
        })
}


export function performTransaction(data, company){
    const PERFORM_ACTION_MAP = {
        [Transaction.types.ISSUE_UNALLOCATED]:  TransactionService.performIssueUnallocated,
        [Transaction.types.ISSUE_TO]:  TransactionService.performIssueTo,
        [Transaction.types.NAME_CHANGE]: TransactionService.performNameChange,
        [Transaction.types.ADDRESS_CHANGE]: TransactionService.performAddressChange,
    };
    if(!data.actions){
        return;
    }
    let nextState, current, transactions;
    return company.getCurrentCompanyState()
        .then(function(_state){
            current = _state;
            return currentRoot.buildNext({});
        })
        .then(function(_nextState){
            nextState = _nextState;
            // TODO, serviously consider having EACH action create a persistant graph
            // OR, force each transaction set to be pre grouped
            return Promise.reduce(data.actions, function(arr, action){
                sails.log.verbose('Performing action: ', JSON.stringify(action, null, 4), data.documentId);
                let result;
                if(PERFORM_ACTION_MAP[action.transactionType]){
                    result = PERFORM_ACTION_MAP[action.transactionType]({
                        ...action, documentId: data.documentId
                    }, nextState, current, data.effectiveDate);
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
            return nextState.setTransaction(transaction.id);
        })
        .then(function(){
            nextState.save();
        })
        .then(function(){
            return company.setCurrentCompanyState(nextState);
         })
         .then(function(){
            return company.save();
         });
}