const _ = require('lodash');
const moment = require('moment');


function normalizeAddress(address){
    address = (address || '').replace(/^C\/- /, '').replace(/, \d{4,5}, /, ', ');
    return address.replace(/, NZ$/, ', New Zealand')

}

export function validateAnnualReturn(data, companyState, effectiveDate){
    return companyState.stats()
        .then((stats) => {
            if(stats.totalShares != data.totalShares){
                throw new sails.config.exceptions.InvalidInverseOperation('Total shares do not match, documentId: ' +documentId);
            }
            const state = companyState.toJSON();
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
                sails.log.error(JSON.stringify(currentHoldings))
                sails.log.error(JSON.stringify(expectedHoldings))
                throw new sails.config.exceptions.InvalidInverseOperation('Holdings do not match, documentId: ' +data.documentId);
            }
            if(normalizeAddress(state.registeredCompanyAddress) !== normalizeAddress(data.registeredCompanyAddress) ||
                 normalizeAddress(state.addressForService) !== normalizeAddress(data.addressForService)){
                sails.log.error(state.registeredCompanyAddress, data.registeredCompanyAddress)
                sails.log.error(state.addressForService, data.addressForService)
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
    if(amend.afterAmount && (sum !== amend.afterAmount)){
        throw new sails.config.exceptions.InvalidInverseOperation('After amount does not match, amend, documentId: ' +amend.documentId)
    }
    return Promise.resolve(holding);
}

export function validateInverseIssue(data, companyState){
    return companyState.stats()
        .then((stats) =>{
            if(!Number.isInteger(data.amount) || data.amount <= 0 ){
                throw new sails.config.exceptions.InvalidInverseOperation('Amount must be postive integer, documentId: ' +data.documentId)
            }
            if(!Number.isSafeInteger(data.amount)){
                throw new sails.config.exceptions.InvalidInverseOperation('Unsafe number, documentId: ' +data.documentId)
            }
            if(stats.totalShares != data.toAmount){
                sails.log.debug(stats)
                throw new sails.config.exceptions.InvalidInverseOperation('After amount does not match, issue, documentId: ' +data.documentId)
            }
            if(data.fromAmount + data.amount !== data.toAmount ){
                throw new sails.config.exceptions.InvalidInverseOperation('Issue amount sums to not add up, documentId: ' +data.documentId)
            }
        })
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

export function performInverseAmend(data, companyState, previousState, effectiveDate){
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
            transaction = Transaction.build({type: transactionType,  data: data, effectiveDate: effectiveDate});
            return transaction.save();
        })
        .then(() => {
            const prevHolding = previousState.getHoldingBy({holdingId: holding.holdingId});
            return prevHolding.setTransaction(transaction.id);
        })
        .then(() => {
            return transaction;
        });
}

export function performInverseHoldingChange(data, companyState, previousState, effectiveDate){
    return Promise.resolve({})
        .then(()=>{
            let current = companyState.getMatchingHolding(data.afterHolders);
            const transaction = Transaction.build({type: data.transactionType,  data: data, effectiveDate: effectiveDate})
            if(!current){
                 throw new sails.config.exceptions.InvalidInverseOperation('Cannot find matching holding documentId: ' +data.documentId)
            }
            companyState.mutateHolders(current, data.beforeHolders);
            return Promise.resolve(transaction);
        })
}

export function performInverseHolderChange(data, companyState, previousState, effectiveDate){
    return Promise.resolve({})
        .then(()=>{
            const transaction = Transaction.build({type: data.transactionType,  data: data, effectiveDate: effectiveDate});
            companyState.replaceHolder(data.afterHolder, data.beforeHolder);
            return Promise.resolve(transaction);

        })
        .catch((e)=>{
            sails.log.error(e);
            throw new sails.config.exceptions.InvalidInverseOperation('Cannot find holder, holder change, documentId: ' +data.documentId)
        });
}

export function performInverseNewAllocation(data, companyState, previousState, effectiveDate){
    companyState.combineUnallocatedParcels({amount: data.amount});
    let holding = companyState.getMatchingHolding(data.holders, [{amount: data.amount}]);

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

}

export function performInverseRemoveAllocation(data, companyState, previousState, effectiveDate){
    companyState.subtractUnallocatedParcels({amount: data.amount, shareClass: data.shareClass});
    const holding = Holding.buildDeep({holders: data.holders,
        parcels: [{amount: data.amount, shareClass: data.shareClass}]});
    // replace holders
    holding.dataValues.holders = holding.dataValues.holders.map((h) => {
        return previousState.getHolderBy(h.get()) || h;
    });
    companyState.dataValues.holdings.push(holding);
    return Promise.resolve(Transaction.build({type: data.transactionSubType || data.transactionType,  data: data, effectiveDate: effectiveDate}))
}


export function validateInverseNameChange(data, companyState,  effectiveDate){
    if(data.newCompanyName !== companyState.companyName){
        throw new sails.config.exceptions.InvalidInverseOperation('New company name does not match expected name, documentId: ' +data.documentId)
    }
}

export function performInverseNameChange(data, companyState, previousState, effectiveDate){
    validateInverseNameChange(data, companyState);
    companyState.set('companyName', data.previousCompanyName);
    return Promise.resolve(Transaction.build({type: data.transactionType,  data: data, effectiveDate: effectiveDate}))
}

export function validateInverseAddressChange(data, companyState, effectiveDate){
    if(normalizeAddress(data.newAddress) !== normalizeAddress(companyState[data.field])){
        throw new sails.config.exceptions.InvalidInverseOperation('New address does not match expected name, documentId: ' +data.documentId)
    }
}

export function performInverseAddressChange(data, companyState, previousState, effectiveDate){
    validateInverseAddressChange(data, companyState);
    companyState.set(data.field, data.previousAddress);
    return Promise.resolve(Transaction.build({type: data.transactionType,  data: data, effectiveDate: effectiveDate}))
}

export function validateNewDirector(data, companyState){
    const director = _.find(companyState.dataValues.directors, (d)=> {
        return d.person.name === data.name ; /*&& d.person.address === data.address */;
    })
    if(!director){
        throw new sails.config.exceptions.InvalidInverseOperation('Could not find expected new director, documentId: ' +data.documentId)
    }
}


export function performNewDirector(data, companyState, previousState, effectiveDate){
    validateNewDirector(data, companyState);
    companyState.dataValues.directors = _.reject(companyState.dataValues.directors, (d) => {
        return d.person.name === data.name /*&&  && d.person.address == data.address */;
    });
    return Promise.resolve(Transaction.build({type: data.transactionType,  data: data, effectiveDate: effectiveDate}))
}

export function performRemoveDirector(data, companyState, previousState, effectiveDate){
    companyState.dataValues.directors.push(Director.build({
        appointment: effectiveDate, person: {name: data.name, address: data.address}},
        {include: [{model: Person, as: 'person'}]}));
    return Promise.resolve(Transaction.build({type: data.transactionType,  data: data, effectiveDate: effectiveDate}))
}
