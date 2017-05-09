
"use strict"
const _ = require('lodash');
const moment = require('moment');
const Promise = require('bluebird');
const cls = require('continuation-local-storage');
const session = cls.getNamespace('session');
const uuid = require('node-uuid')

export function validateAnnualReturn(data, companyState){
    const state = companyState.toJSON();
    let throwDirectors, throwTotal, allocatedEqual;
    return companyState.stats(true)
        .then((stats) => {
            if(stats.totalShares !== data.totalShares){
                sails.log.error('stats: ', stats, data.totalShares)
                throwTotal = true;
                allocatedEqual = stats.totalAllocatedShares === data.totalShares;
            }
            // extract name for directors
            const currentDirectors = JSON.stringify(_.sortBy(_.map(state.directorList.directors, (d)=>_.pick(d.person, 'name'/*, 'address'*/)), 'name'));
            const expectedDirectors = JSON.stringify(_.sortBy(_.map(data.directors, (d)=>_.pick(d, 'name'/*, 'address'*/)), 'name'));

            const holdingToString = (holdings) => {
                return _.sortByAll(holdings.map((holding)=>{
                    return  {holders: _.sortBy(holding.holders.map((p)=>_.pick(p.person ? p.person : p, 'name')), 'name'), parcels: [holding.parcels.reduce((acc, p) => ({amount: acc.amount+p.amount}), {amount:0})]};
                }), (holding) => -holding.parcels.reduce((sum,p) => sum+p.amount, 0), (holding) => holding.holders[0].name);

            }

            const currentHoldings = holdingToString(state.holdingList.holdings)
            const expectedHoldings = holdingToString(data.holdings)

            if(JSON.stringify(currentDirectors).toLocaleUpperCase() !== JSON.stringify(expectedDirectors).toLocaleUpperCase()){
                sails.log.error('Current directors: '+JSON.stringify(currentDirectors))
                sails.log.error('Expected directors: '+JSON.stringify(expectedDirectors));
                throwDirectors = true;
            }
            if(JSON.stringify(currentHoldings).toLocaleUpperCase() !== JSON.stringify(expectedHoldings).toLocaleUpperCase()){
                sails.log.error('Current', JSON.stringify(currentHoldings))
                sails.log.error('Expected', JSON.stringify(expectedHoldings))
                throw new sails.config.exceptions.InvalidInverseOperation('Holdings do not match', {
                    action: data,
                    importErrorType: sails.config.enums.ANNUAL_RETURN_HOLDING_DIFFERENCE,
                    companyState: companyState
                });
            }
            return Promise.join(
                         AddressService.normalizeAddress(data.registeredCompanyAddress),
                         AddressService.normalizeAddress(data.addressForService)
                         )
            })
        .spread((registeredCompanyAddress, addressForService) => {
            const reg = AddressService.compareAddresses(state.registeredCompanyAddress, registeredCompanyAddress);
            const serv = AddressService.compareAddresses(state.addressForService, addressForService)
             if(!reg){
                sails.log.error(state.registeredCompanyAddress, '/', registeredCompanyAddress)
                throw new sails.config.exceptions.InvalidIgnorableInverseOperation('Registered Address does not match');
             }
             if(!serv){
                sails.log.error(state.addressForService, '/', addressForService)
                throw new sails.config.exceptions.InvalidIgnorableInverseOperation('Service Address does not match');
             }
        })
        .then(() => {
            if(throwDirectors){
                throw new sails.config.exceptions.InvalidIgnorableInverseOperation('Directors do not match: ' +data.documentId);
            }
            if(throwTotal){
                if(allocatedEqual){
                    throw new sails.config.exceptions.InvalidIgnorableInverseOperation('Total shares do not match');
                }
                else{
                    throw new sails.config.exceptions.InvalidInverseOperation('Total shares do not match', {
                        action: data,
                        importErrorType: sails.config.enums.ANNUAL_RETURN_SHARE_COUNT_DIFFERENCE,
                        companyState: companyState
                    });

                }
            }
        });
};

export function performAnnualReturn(data, companyState, previousState, effectiveDate){
    const transaction = Transaction.build({type: data.transactionType, data: {...data}, effectiveDate: effectiveDate});
    return validateAnnualReturn(data, companyState)
        .then(() => {
            return transaction;
        })
        .catch(sails.config.exceptions.InvalidIgnorableInverseOperation, e => {
            transaction.dataValues.data.failedValidation =  e.message;
            return transaction;
        })
}


export function validateInverseAmend(amend, companyState, previousState){
    if(amend.transactionType === Transaction.types.AMEND){
        throw new sails.config.exceptions.AmbiguousInverseOperation('Amend type unknown',{
            action: amend,
            companyState: companyState,
            importErrorType: sails.config.enums.UNKNOWN_AMEND
        })
    }

    let holding = companyState.getMatchingHolding({
        holders: amend.afterHolders,
        holdingId: amend.holdingId,
        parcels: (amend.parcels || []).map(p => ({amount: amend.inferAmount ? undefined : p.afterAmount, shareClass: p.shareClass}))},  {ignoreCompanyNumber: true});


    if(!holding){
        holding = companyState.getMatchingHolding({
            holders: amend.afterHolders,
            holdingId: amend.holdingId
        }, {ignoreCompanyNumber: true});

        if(holding && holding.sumOfParcels() === _.sum(amend.parcels, 'afterAmount')){
            throw new sails.config.exceptions.InvalidInverseOperation('Transaction must specify share classes',{
                action: amend,
                companyState: previousState,
                importErrorType: sails.config.enums.UNKNOWN_AMEND
            })
        }
    }

    if(!holding){
        throw new sails.config.exceptions.InvalidInverseOperation('Matching Holding not found',{
            action: amend,
            companyState: previousState,
            importErrorType: sails.config.enums.HOLDING_NOT_FOUND
        })
    }

    !amend.inferAmount && amend.parcels.map(newParcel => {
        if(!amend.inferAmount && (newParcel.beforeAmount < 0 || newParcel.afterAmount < 0)){
            throw new sails.config.exceptions.InvalidInverseOperation('Before and after amounts must be natural numbers ( n >=0 ')
        }
        if(Math.abs(newParcel.beforeAmount - newParcel.afterAmount) !== newParcel.amount){
            throw new sails.config.exceptions.InvalidOperation('Amount is incorrect')
        }
        if(!Number.isSafeInteger(newParcel.amount)){
            throw new sails.config.exceptions.InvalidOperation('Unsafe number')
        }
    })
    const parcels = amend.inferAmount ? null : amend.parcels.map(p => ({amount: amend.inferAmount ? undefined : p.afterAmount , shareClass: p.shareClass}));
    if(!amend.inferAmount){
        holding.dataValues.parcels.map(parcel => {
            amend.parcels.map(newParcel => {
                if(Parcel.match(parcel, newParcel) && parcel.amount !== newParcel.afterAmount){
                    throw new sails.config.exceptions.InvalidInverseOperation('After amount does not match, amend')
                }

            })
        });
    }
    return Promise.resolve(holding);
}



export function validateInverseChangeShares(data, companyState){
    return companyState.stats(true)
        .then((stats) =>{
            data.parcels.map((newParcel) => {
                if(!Number.isInteger(newParcel.amount) || newParcel.amount <= 0){
                    throw new sails.config.exceptions.InvalidInverseOperation('Amount must be natural number ( n >=0 )', {
                            action: data,
                            importErrorType: sails.config.enums.INVALID_ISSUE,
                            companyState: companyState
                        });
                }
                if(!Number.isSafeInteger(newParcel.amount)){
                    throw new sails.config.exceptions.InvalidInverseOperation('Unsafe number')
                }
                const shareStats = !newParcel.shareClass ? {amount: stats.totalShares}: (stats.shareCountByClass[newParcel.shareClass || null] || {amount: 0});

                if(shareStats.amount !== newParcel.afterAmount && newParcel.afterAmount !== undefined){
                    throw new sails.config.exceptions.InvalidInverseOperation('After amount does not match, change shares', {
                        action: data,
                        importErrorType: sails.config.enums.INVERSE_INCREASE_SUM_MISMATCH,
                        companyState: companyState
                    });
                }

            });
        })
}

export function validateChangeShares(data, companyState){
    return companyState.stats(true)
        .then((stats) =>{
            data.parcels.map((newParcel) => {
                if(!Number.isInteger(newParcel.amount) || newParcel.amount <= 0){
                    throw new sails.config.exceptions.InvalidInverseOperation('Amount must be natural number ( n >=0 )', {
                            action: data,
                            importErrorType: sails.config.enums.INVALID_ISSUE,
                            companyState: companyState
                        });
                }
                const shareStats = stats.shareCountByClass[newParcel.shareClass || null] || {amount: 0};
                if(!Number.isSafeInteger(newParcel.amount)){
                    throw new sails.config.exceptions.InvalidInverseOperation('Unsafe number')
                }

                if(shareStats.amount !== newParcel.beforeAmount && newParcel.beforeAmount !== undefined){
                     throw new sails.config.exceptions.InvalidOperation('Issue amount does not match current value')
                }

                /*if(newParcel.beforeAmount + newParcel.amount !== newParcel.afterAmount && newParcel.afterAmount !== undefined){
                    throw new sails.config.exceptions.InvalidOperation('Change amount sums to not add up')
                }*/
            });
        })
}



export function performDecreaseShares(data, companyState, previousState, effectiveDate){
    return validateChangeShares(data, companyState)
        .then(() => {
            data = {...data};
            data.parcels = data.parcels.map(newParcel => {
                const match = companyState.subtractUnallocatedParcels({amount: newParcel.amount, shareClass: newParcel.shareClass});
                return {...newParcel, shareClass: match.shareClass};
            });
            const transaction = Transaction.build({type: data.transactionType, data: data, effectiveDate})
            return transaction;
        })
}


export function performIncreaseShares(data, companyState, previousState, effectiveDate){
    return validateChangeShares(data, companyState)
        .then(() => {
            data = {...data};
            data.parcels = data.parcels.map(newParcel => {
                const match = companyState.combineUnallocatedParcels({amount: newParcel.amount, shareClass: newParcel.shareClass});
                return {...newParcel, shareClass: match.shareClass};
            });
            const transaction = Transaction.build({type: data.transactionType, data, effectiveDate});
            return transaction;
        })
}

export function performInverseIncreaseShares(data, companyState, previousState, effectiveDate){
    return validateInverseChangeShares(data, companyState)
        .then(() => {
            data = {...data};
            data.parcels = data.parcels.map(newParcel => {
                const match = companyState.subtractUnallocatedParcels({amount: newParcel.amount, shareClass: newParcel.shareClass});
                return {...newParcel, shareClass: match.shareClass};
            });
            const transaction = Transaction.build({type: data.transactionType, data, effectiveDate})
            return transaction;
        })
}


export function performInverseDecreaseShares(data, companyState, previousState, effectiveDate){
    return validateInverseChangeShares(data, companyState)
        .then(() => {
            data = {...data};
            data.parcels = data.parcels.map(newParcel => {
                const match = companyState.combineUnallocatedParcels({amount: newParcel.amount, shareClass: newParcel.shareClass});
                return {...newParcel, shareClass: match.shareClass};
            });
            const transaction = Transaction.build({type: data.transactionType, data: data, effectiveDate});
            return transaction;
        })
}


export const performInverseIssue = performInverseIncreaseShares;
export const performInverseConversion = performInverseIncreaseShares;

export const performInversePurchase = performInverseDecreaseShares;
export const performInverseRedemption = performInverseDecreaseShares;
export const performInverseConsolidation = performInverseDecreaseShares;
export const performInverseAcquisition = performInverseDecreaseShares;
export const performInverseCancellation = performInverseDecreaseShares;



export const performIssue = performIncreaseShares;
export const performConversion= performIncreaseShares;

export const performAcquisition = performDecreaseShares;
export const performConsolidation = performDecreaseShares;
export const performRedemption = performDecreaseShares;
export const performCancellation = performDecreaseShares;
export const performPurchase = performDecreaseShares;


export  function performInverseAmend(data, companyState, previousState, effectiveDate, userId){
    let transaction, holding, prevHolding, afterParcels;
    data = _.cloneDeep(data);
    return Promise.resolve({})
        .then(() => {
            return validateInverseAmend(data, companyState, previousState);
        })
        .then((_holding) => {
            holding = _holding;
            return companyState.dataValues.holdingList.buildNext();
        })
        .then(holdingList => {
            companyState.dataValues.holdingList = holdingList;
            companyState.dataValues.h_list_id = null;
            if(data.inferAmount){
                data = {...data}
                // note: prevousState
                let inverseHolding;
                if(data.beforeAmountLookup){
                    inverseHolding = findHolding({
                            holders: data.beforeAmountLookup.afterHolders,
                            holdingId: data.beforeAmountLookup.holdingId
                        },
                        data, previousState, {
                            multiple: sails.config.enums.MULTIPLE_HOLDING_TRANSFER_SOURCE,
                            none: sails.config.enums.HOLDING_TRANSFER_SOURCE_NOT_FOUND,
                            shareClassesMissMatch: sails.config.enums.UNKNOWN_AMEND
                        });
                }
                else{
                    inverseHolding = findHolding({
                            holders: data.afterAmountLookup.beforeHolders,
                            holdingId: data.afterAmountLookup.holdingId
                        },
                        data, companyState, {
                            multiple: sails.config.enums.MULTIPLE_HOLDING_TRANSFER_SOURCE,
                            none: sails.config.enums.HOLDING_TRANSFER_SOURCE_NOT_FOUND,
                            shareClassesMissMatch: sails.config.enums.UNKNOWN_AMEND
                        });
                }
                // TODO, needs before and after amount
                data.parcels = inverseHolding.dataValues.parcels.map(p => ({amount: p.amount, shareClass: p.shareClass, beforeAmount: p.amount, afterAmount: 0 }))
                data.inferAmount = false;
            }
            if(session.get('REQUIRE_CONFIRMATION') && !data.userConfirmed && !data.confirmationUnneeded){
                throw new sails.config.exceptions.AmbiguousInverseOperation('Confirmation Required',{
                    action: data,
                    companyState: companyState,
                    importErrorType: sails.config.enums.CONFIRMATION_REQUIRED
                })
            }
            afterParcels = data.parcels.map(p => ({shareClass: p.shareClass, amount: p.afterAmount}));

            let increase;
            data.parcels.map((newParcel, i) => {
                const difference = newParcel.afterAmount - newParcel.beforeAmount;
                let match;
                increase = difference > 0;
                if(increase){
                    companyState.combineUnallocatedParcels(newParcel)
                }
                else{
                    match = companyState.subtractUnallocatedParcels(newParcel)
                    if(!newParcel.shareClass){
                        newParcel.shareClass = match.shareClass;
                    }
                }
                if(!newParcel.shareClass && holding.getParcelByAmount(afterParcels[i].amount)){
                    newParcel.shareClass = holding.getParcelByAmount(afterParcels[i].amount).shareClass;
                }
            });

            const newHolding = {holders: data.afterHolders, holdingId: data.holdingId, parcels: data.parcels};
            if(increase){
                companyState.subtractHoldings([newHolding], afterParcels);
            }
            else{
                companyState.combineHoldings([newHolding], afterParcels);
            }


        })
        .then(() => {
            const transactionType  = data.transactionType;
            transaction = Transaction.build({type: transactionType,  data, effectiveDate: effectiveDate});
            return transaction.save();
        })
        .then(() => {
            if(previousState){
                prevHolding = previousState.getHoldingBy({holdingId: holding.holdingId});
            }
            // if we inferred shareClass from unallocatedParcels, lets assign it here (mutate it)
            //if(data.shareClass && !_.find(prevHolding.parcels, p => p.shareClass)){
            //    return Promise.all(prevHolding.dataValues.parcels.map(p => p.replace({shareClass: data.shareClass})).map(p => p.save()));
            //}
        })
        .then(parcels => {
            //if(parcels){
             //   prevHolding.setParcels(parcels);
            //}
            if(previousState){
                prevHolding.set('transactionId', transaction.id);
                return prevHolding.save();
            }
        })
        .then(() => {
            return transaction;
        });
};


function findHolding(holding, action, companyState, errors={}){
    let current = companyState.getMatchingHoldings(holding);
    if(!current.length){
        current = companyState.getMatchingHoldings(holding, {ignoreCompanyNumber: true});
    }
    if(!current.length){
        const candidate = companyState.getMatchingHolding({...holding, parcels: null},  {ignoreCompanyNumber: true});
        if(candidate && candidate.sumOfParcels() === _.sum(holding.parcels, 'amount')){
            throw new sails.config.exceptions.InvalidInverseOperation('Transaction must specify share classes', {
                action: action,
                companyState: companyState,
                importErrorType: sails.config.enums.UNKNOWN_AMEND
            })
        }
    }


    if(!current.length){
         throw new sails.config.exceptions.InvalidInverseOperation('Cannot find matching holding', {
            action: action,
            companyState: companyState,
            importErrorType: errors.none})
    }
    else if(current.length > 1 && session.get('options')){
        // ambiguity resolving strategy
        if(!session.get('options')[session.get('index')]){
            session.get('options')[session.get('index')] = {index: 0, keys: current.map((c, i) => i)} //, keys: current.map(c => c.holdingId).sort()};
        }
        // have to sort by something
        current = _.sortBy(current, c => c.holdingId);
        const obj = session.get('options')[session.get('index')]
        current = current[obj.index];
    }
    else if(current.length > 1){
        throw new sails.config.exceptions.AmbiguousInverseOperation('Multiple holding matches', {
            action: action ,
            importErrorType: errors.multiple,
            possibleMatches: current.map(c => c.toJSON())
        }
      )
    }
    else{
        current = current[0];
    }
    return current;
}


function inverseFindHolding(data, companyState){
    let current = companyState.getMatchingHoldings({holders: data.afterHolders, holdingId: data.holdingId});
    if(!current.length){
        current = companyState.getMatchingHoldings({holders: data.afterHolders}, {ignoreCompanyNumber: true});
    }
    if(!current.length){
         throw new sails.config.exceptions.InvalidInverseOperation('Cannot find matching holding', {
            action: data,
            companyState: companyState,
            importErrorType: sails.config.enums.HOLDING_NOT_FOUND
        })
    }
    else if(current.length > 1 && session.get('options')){
        // ambiguity resolving strategy
        if(!session.get('options')[session.get('index')]){
            session.get('options')[session.get('index')] = {index: 0, keys: current.map((c, i) => i).sort()} //, keys: current.map(c => c.holdingId).sort()};
        }
        // have to sort by something
        current = _.sortBy(current, c => c.holdingId);
        const obj = session.get('options')[session.get('index')]
        current = current[obj.index];
    }
    else if(current.length > 1){
        throw new sails.config.exceptions.AmbiguousInverseOperation('Multiple holding matches', {
            action: action || data,
            importErrorType:sails.config.enums.MULTIPLE_HOLDINGS_FOUND,
            possibleMatches: current.map(c => c.toJSON())
        }
      )
    }else{
        current = current[0];
    }
    return current;
}


export function performInverseHoldingTransfer(data, companyState, previousState, effectiveDate){
    throw sails.config.exceptions.InvalidInverseOperation('Holding transfers are deprecated');
}

export function performHoldingTransfer(data, companyState, previousState, effectiveDate){
    throw sails.config.exceptions.InvalidOperation('Holding transfers are deprecated');
}

export function performInverseHoldingChange(data, companyState, previousState, effectiveDate, userId){
    const normalizedData = _.cloneDeep(data);
    (normalizedData.parcels || []).map(p => {
        if(!p.amount){
            p.amount = undefined;
        }
    })
     let current;
    // new rule:  holder changes ONLY effective name or holder_j meta data.  Persons must remain the same
    const transaction = Transaction.build({type: data.transactionType,  data: data, effectiveDate: effectiveDate});
    return companyState.dataValues.holdingList.buildNext()
        .then(holdingList => {
            companyState.dataValues.holdingList = holdingList;
            companyState.dataValues.h_list_id = null;
            return transaction.save();
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
            current = inverseFindHolding(normalizedData, companyState);
            if(data.beforeName){
                current.dataValues.name =  data.beforeName;
            }
            if(data.beforeVotingShareholder){
                const index = companyState.dataValues.holdingList.dataValues.holdings.indexOf(current);
                const newHolding =  current.buildNext();
                companyState.dataValues.holdingList.dataValues.holdings[index] = newHolding;
                newHolding.dataValues.holders = newHolding.dataValues.holders.map(h => {
                    if(h.isEqual(data.beforeVotingShareholder)){
                        h.dataValues.data = {...h.dataValues.data, votingShareholder: true};
                    }
                    else{
                        h.dataValues.data = _.omit(h.dataValues.data || {}, 'votingShareholder');
                    }
                    return h;
                });
            }
        })
        .then(() => {
            const previousHolding = previousState.getMatchingHolding(current);
            return previousHolding.setTransaction(transaction);
        })
        .then(() => {
            return transaction;
        });
};


export function performHoldingChange(data, companyState, previousState, effectiveDate, userId){
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
            let current = companyState.getMatchingHoldings({holdingId: data.holdingId, holders: normalizedData.beforeHolders});
            if(current && current.length > 1){
                throw new sails.config.exceptions.InvalidOperation('Multiple holdings found, holding change')
            }
            current = current[0];
            if(!current){
                throw new sails.config.exceptions.InvalidOperation('Cannot find holding, holding change')
            }
            if(data.afterVotingShareholder || data.afterName){
                const index = companyState.dataValues.holdingList.dataValues.holdings.indexOf(current);
                if(data.afterName){
                    current.dataValues.name =  data.afterName;
                }
                if(data.afterVotingShareholder){
                    const newHolding = current.buildNext()
                    companyState.dataValues.holdingList.dataValues.holdings[index] = newHolding;
                    newHolding.dataValues.transaction = transaction;
                    newHolding.dataValues.holders = newHolding.dataValues.holders.map(h => {
                        if(h.isEqual(data.afterVotingShareholder)){
                            h = h.buildNext();
                            h.data = h.dataValues.data = {...h.dataValues.data, votingShareholder: true};
                        }
                        else if((h.dataValues.data || {}).votingShareholder){
                            h = h.buildNext();
                            h.data = h.dataValues.data = _.omit(h.dataValues.data || {}, 'votingShareholder');
                        }
                        return h;
                    });
                }
            }
        })
        .then(() => {
            return transaction;
        });
};


export const performInverseHolderChange = function(data, companyState, previousState, effectiveDate, userId){
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
            return companyState.replaceHolder(normalizedData.afterHolder, normalizedData.beforeHolder, null, userId);
        })
        .then(function(){
            return transaction.save();
        })
        .then(function(){
            // find previousState person instance, attach mutating transaction
            // TODO, loop
            const holder = previousState.getHolderBy(normalizedData.afterHolder);
            return holder.dataValues.person.setTransaction(transaction);
        })
        .then(() => {
            return transaction;
        })
        .catch((e)=>{
            if(data.IGNORABLE){
                return;
            }
            sails.log.error(e);
            throw new sails.config.exceptions.InvalidInverseOperation('Cannot find holder, holder change', {
                action: data,
                importErrorType: sails.config.enums.HOLDER_NOT_FOUND,
                companyState: companyState
            })
        });
};


export const performHolderChange = function(data, companyState, previousState, effectiveDate, userId){
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
            return companyState.replaceHolder(normalizedData.beforeHolder, normalizedData.afterHolder, transaction, userId);
        })
        .then(function(){
            return transaction;
        })
        .catch((e)=>{
            throw new sails.config.exceptions.InvalidOperation('Cannot find holder, holder change')
        });
};


export  function performInverseNewAllocation(data, companyState, previousState, effectiveDate){
    if(data.transactionType === Transaction.types.NEW_ALLOCATION){
        throw new sails.config.exceptions.AmbiguousInverseOperation('Amend type unknown',{
            action: data,
            importErrorType: sails.config.enums.UNKNOWN_AMEND
        })
    }

    data = _.cloneDeep(data);
    return companyState.dataValues.holdingList.buildNext()
    .then(function(holdingList){
        companyState.dataValues.holdingList = holdingList;
        companyState.dataValues.h_list_id = null;

        if(session.get('REQUIRE_CONFIRMATION') && !data.userConfirmed && !data.confirmationUnneeded){
            throw new sails.config.exceptions.AmbiguousInverseOperation('Confirmation Required',{
                action: data,
                companyState: companyState,
                importErrorType: sails.config.enums.CONFIRMATION_REQUIRED
            })
        }
        let holding = findHolding({holders: data.holders, holdingId: data.holdingId, parcels: (data.parcels || []).map(p => ({...p, amount: data.inferAmount ? undefined: p.amount}))},
          data, companyState, {
            multiple: sails.config.enums.MULTIPLE_HOLDINGS_FOUND,
            none: sails.config.enums.HOLDING_NOT_FOUND,
            shareClassesMissMatch: sails.config.enums.UNKNOWN_AMEND
          });

        if(data.inferAmount){
            data = {...data}
            data.parcels = holding.dataValues.parcels.map(p => ({amount: p.amount, beforeAmount: 0, afterAmount: p.amount, shareClass: p.shareClass}));
            data.inferAmount = false;
        }
        data.parcels.map(newParcel => {
            const parcel = holding.getParcelByShareClass(newParcel.shareClass);
            if(!newParcel.shareClass){
                newParcel.shareClass = parcel.shareClass;
            }
            companyState.combineUnallocatedParcels({amount: newParcel.amount, shareClass: newParcel.shareClass});
            if(parcel.amount !== newParcel.amount){
                throw new sails.config.exceptions.InvalidInverseOperation('Allocation total does not match, new allocation');
            }
        });

        holdingList.dataValues.holdings = _.without(holdingList.dataValues.holdings, holding);
        const transaction = Transaction.build({type: data.transactionType,  data: data, effectiveDate: effectiveDate});

        return transaction.save()
            .then((transaction) => {
                if(previousState){
                    const prevHolding = previousState.getHoldingBy({holdingId: holding.holdingId});
                    return prevHolding.setTransaction(transaction.id);
                }
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
        return CompanyState.populatePersonIds(data.holders || data.afterHolders);
    })
    .then(function(personData){
        if(!personData.length){
            throw new sails.config.exceptions.InvalidInverseOperation('Allocation missing holders');
        }
        const holding = Holding.buildDeep({
                holders: personData.map(p => ({person: p})), holdingId: data.holdingId,
                parcels: []});
        companyState.dataValues.holdingList.dataValues.holdings.push(holding);
        return Transaction.build({type: data.transactionType,  data: data, effectiveDate: effectiveDate});
    })
}


export function validateInverseNameChange(data, companyState,  effectiveDate){
    if(data.newCompanyName !== companyState.companyName){
        throw new sails.config.exceptions.InvalidInverseOperation('New company name does not match expected name')
    }
    if(data.previousCompanyName === data.newCompanyName){
        throw new sails.config.exceptions.InvalidInverseOperation('Company names do not differ')
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
        throw new sails.config.exceptions.InvalidInverseOperation('Previous company name does not match expected name')
    }
    if(data.previousCompanyName === data.newCompanyName){
        throw new sails.config.exceptions.InvalidInverseOperation('Company names do not differ')
    }
    if(!data.newCompanyName){
        throw new sails.config.exceptions.InvalidInverseOperation('No new company name supplied')
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
        if(!data.userBypassValidation && !AddressService.compareAddresses(newAddress, companyState[data.field])){
            sails.log.error(newAddress, companyState[data.field])
            throw new sails.config.exceptions.InvalidInverseOperation('New address does not match expected',
                    {
                    action: data,
                    companyState: companyState,
                    importErrorType: sails.config.enums.ADDRESS_DIFFERENCE
                });
        }
        if(!data.userBypassValidation && ['registeredCompanyAddress',
            'addressForShareRegister',
            'addressForService'].indexOf(data.field) === -1){
            throw new sails.config.exceptions.InvalidInverseOperation('Address field not valid',
                    {
                    action: data,
                    companyState: companyState,
                    importErrorType: sails.config.enums.ADDRESS_DIFFERENCE
                })
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
            throw new sails.config.exceptions.InvalidOperation('Address field not valid')
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
    return Promise.resolve(Transaction.build({type: data.transactionType,  data: data, effectiveDate: effectiveDate}));
};

export function performInverseDetailsChange(data, companyState, previousState, effectiveDate){
    companyState.set(data.field, data.value);
    return Promise.resolve(Transaction.build({type: data.transactionType,  data: data, effectiveDate: effectiveDate}));
};



export function performInverseNewDirector(data, companyState, previousState, effectiveDate){
    return companyState.dataValues.directorList.buildNext()
    .then(function(dl){
        // Dangerous, might be multiple, so should take the 'closest'

        let directors = _.reject(dl.dataValues.directors, (d) => {
            return d.person.isEqual(data);
        });

        if(directors.length === dl.dataValues.directors.length){
            directors = _.reject(dl.dataValues.directors, (d) => {
                return d.person.isEqual(data, {skipAddress: true});
            });
        }

        if(directors.length < dl.dataValues.directors.length -1){
            throw new sails.config.exceptions.InvalidInverseOperation('Could not add new director', {
                action: data,
                importErrorType: sails.config.enums.MULTIPLE_DIRECTORS_FOUND,
                companyState: companyState
            });
        }
        if(directors.length === dl.dataValues.directors.length){
            throw new sails.config.exceptions.InvalidInverseOperation('Could not add new director', {
                action: data,
                importErrorType: sails.config.enums.DIRECTOR_NOT_FOUND,
                companyState: companyState
            });
        }

        dl.dataValues.directors = directors;
        companyState.dataValues.directorList = dl;

        return Transaction.build({type: data.transactionType,  data: data, effectiveDate: effectiveDate});
    });
}

export function performInverseRemoveDirector(data, companyState, previousState, effectiveDate, userId){
    return companyState.dataValues.directorList.buildNext()
    .then(function(dl){
        companyState.dataValues.directorList = dl;
        return CompanyState.findOrCreatePerson({name: data.name, address: data.address, personId: data.personId}, userId)
    })
    .then(person => {
        const director = Director.build({
            appointment: effectiveDate, personId: person.id})
        director.dataValues.person = person;
        // TODO, add transaction data
        companyState.dataValues.directorList.dataValues.directors.push(director);
        return Transaction.build({type: data.transactionType,  data: data, effectiveDate: effectiveDate})
    });
}

export function performInverseUpdateDirector(data, companyState, previousState, effectiveDate, userId){
    const transaction = Transaction.build({type: data.transactionType,  data: data, effectiveDate: effectiveDate});
    return companyState.dataValues.directorList.buildNext()
        .then(function(dl){
            companyState.dataValues.directorList = dl;
            return Promise.join(AddressService.normalizeAddress(data.afterAddress), AddressService.normalizeAddress(data.beforeAddress))
        })
        .spread((afterAddress, beforeAddress) => {
            return companyState.replaceDirector({name: data.afterName, address: afterAddress, personId: data.personId, attr: data.personAttr},
                                         {name: data.beforeName, address: beforeAddress, personId: data.personId}, null, userId)
            .then(() => {
               return transaction.save()
            })
            .then(() => {
                 _.find(previousState.dataValues.directorList.dataValues.directors, function(d, i){
                    return d.dataValues.person.isEqual({name: data.afterName, address: afterAddress});
                }).dataValues.person.setTransaction(transaction);
             })
        })
        .then(() => {
            return transaction;
        })
        .catch((e) => {
            sails.log.error(e)
            throw new sails.config.exceptions.InvalidInverseOperation('Could not update director', {
                action: data,
                importErrorType: sails.config.enums.DIRECTOR_NOT_FOUND,
                companyState: companyState
            });
        });
};


export function validateAmend(data, companyState){
    if(!data.holdingId && !(data.holders && data.holders.length)){
        throw new sails.config.exceptions.InvalidOperation('Holders required')
    }

    const parcels =  data.parcels.map(p => ({amount: p.beforeAmount, shareClass: p.shareClass}));;
    const holding = companyState.getMatchingHolding({holders: data.holders, holdingId: data.holdingId, parcels},
                                                    {ignoreCompanyNumber: true});

    if(!holding){
        throw new sails.config.exceptions.InvalidOperation('Matching Holding not found')
    }

    data.parcels.map(newParcel => {
        if(!data.inferAmount && (newParcel.beforeAmount < 0 || newParcel.afterAmount < 0)){
            throw new sails.config.exceptions.InvalidInverseOperation('Before and after amounts must be natural numbers ( n >=0 ')
        }
        if(Math.abs(newParcel.beforeAmount - newParcel.afterAmount) !== newParcel.amount){
            throw new sails.config.exceptions.InvalidOperation('Amount is incorrect')
        }
        if(!Number.isSafeInteger(newParcel.amount)){
            throw new sails.config.exceptions.InvalidOperation('Unsafe number')
        }

    })

    holding.dataValues.parcels.map(parcel => {
        data.parcels.map(newParcel => {
            if(Parcel.match(parcel, newParcel) && parcel.amount !== newParcel.beforeAmount){
                throw new sails.config.exceptions.InvalidInverseOperation('Before amount does not match, amend')
            }
        })
    });

    return Promise.resolve(holding);
}

export const performAmend = Promise.method(function(data, companyState, previousState, effectiveDate){
    let transaction, holding;
    return validateAmend(data, companyState)
        .then((_holding) => {
            holding = _holding;
            return companyState.dataValues.holdingList.buildNext()
        })
        .then(holdingList => {
            data = {...data}
            companyState.dataValues.holdingList = holdingList;
            companyState.dataValues.h_list_id = null;

            const transactionType  = data.transactionType;
            transaction = Transaction.build({type: transactionType,
                data: data, effectiveDate: effectiveDate});
            let increase;
            const parcels = data.parcels.map(newParcel => {
                const difference = newParcel.afterAmount - newParcel.beforeAmount;
                increase = difference > 0;
                return  {amount: Math.abs(difference), shareClass: newParcel.shareClass};
            });

            const newHolding = {holders: data.holders, parcels: parcels, holdingId: data.holdingId};

            if(!increase){
                parcels.map(parcel => companyState.combineUnallocatedParcels(parcel));
               companyState.subtractHoldings([newHolding], null, transaction);
            }
            else{
                parcels.map(parcel => companyState.subtractUnallocatedParcels(parcel));
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
        const holdings = nextState.getMatchingHoldings({holders: data.holders, holdingId: data.holdingId});
        if(!holdings.length){
            throw new sails.config.exceptions.InvalidOperation('Could not find holding')
        }
        const holding = _.filter(holdings, h => !h.hasNonEmptyParcels())[0];
        if(!holding || holding.hasNonEmptyParcels()){
            throw new sails.config.exceptions.InvalidOperation('Holding has non empty parcels')
        }
        holdingList.dataValues.holdings = _.without(holdingList.dataValues.holdings, holding)
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
        function votingShareholder(person){
            if(data.votingShareholder && Person.build(person).isEqual(data.votingShareholder)){
                return {votingShareholder: true}
            }
        }
        const parcels = (data.parcels || []).map(p => ({amount: p.amount, shareClass: p.shareClass}));

        parcels.map(newParcel => {
            nextState.subtractUnallocatedParcels(newParcel)
        });
        const holding = Holding.buildDeep({
            holders: personData.map(p => ({person: p, data: votingShareholder(p) })), name: data.name,
            parcels: parcels
        });
        holding.dataValues.transaction = transaction;
        nextState.dataValues.holdingList.dataValues.holdings.push(holding);
        return transaction;
    });

};


export  function performApplyShareClass(data, nextState, companyState, effectiveDate, userId, isReplay){
    let index, holdingList;
    // TODO, what if there is more than one match?
    if(isReplay){
        return Promise.resolve(Transaction.build({type: data.transactionType,  data: data, effectiveDate: effectiveDate}));
    }
    return nextState.dataValues.holdingList.buildNext()
    .then(function(_holdingList){
        holdingList = _holdingList;
        nextState.dataValues.holdingList = holdingList;
        nextState.dataValues.h_list_id = null;
        index = _.findIndex(holdingList.dataValues.holdings, h => {
            return h.dataValues.holdingId === data.holdingId;
        });
        if(index < 0){
            throw new sails.config.exceptions.InvalidOperation('Cannot find holding to apply share class to')
        }
        if(holdingList.dataValues.holdings[index].parcels.length > 1 || holdingList.dataValues.holdings[index].parcels[0].shareClass){
            throw new sails.config.exceptions.InvalidOperation('Share classes are all ready applied for this shareholding')
        }
        const sum = holdingList.dataValues.holdings[index].parcels.reduce((sum, p) => sum + p.amount, 0);
        const newSum = data.parcels.reduce((sum, p) => sum + p.amount, 0);
        if(sum != newSum){
            throw new sails.config.exceptions.InvalidOperation('Apply share class totals do not match expected totals')
        }

       return holdingList.dataValues.holdings[index].buildNext()
    })
    .then(newHolding => {
        holdingList.dataValues.holdings[index] = newHolding;
        newHolding.dataValues.parcels = data.parcels.map(p => Parcel.build(p));
        return Transaction.build({type: data.transactionType,  data: data, effectiveDate: effectiveDate});
    });
};


export const validateRemoveDirector = Promise.method(function(data, companyState){
    const director = _.find(companyState.dataValues.directorList.dataValues.directors, (d)=> {
        return d.person.isEqual(data, {skipAddress: true});
    })
    if(!director){
        throw new sails.config.exceptions.InvalidOperation('Could not find expected new director')
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

export function performNewDirector(data, companyState, previousState, effectiveDate, userId){
    // find them as a share holder? and vice versa?
    return companyState.dataValues.directorList.buildNext()
    .then(function(dl){
        companyState.dataValues.directorList = dl;
        return CompanyState.findOrCreatePerson({name: data.name, address: data.address, personId: data.personId}, userId)
    })
    .then(person => {
        if(data.personAttr){
            return person.update({attr: {...(person.attr || {}), ...data.personAttr}});
        }
        return person;
    })
    .then(person => {
        if(_.find(companyState.dataValues.directorList.dataValues.directors, d => d.person.isEqual(person))){
            throw new sails.config.exceptions.InvalidOperation('Directorship already appointed')
        }
        const director = Director.build({
            appointment: effectiveDate, personId: person.id});
        director.dataValues.person = person;
        companyState.dataValues.directorList.dataValues.directors.push(director);
        return Transaction.build({type: data.transactionType,  data: data, effectiveDate: effectiveDate})
    });
}

export function performUpdateDirector(data, companyState, previousState, effectiveDate, userId){
    const transaction = Transaction.build({type:  data.transactionType,  data: data, effectiveDate: effectiveDate});
    return companyState.dataValues.directorList.buildNext()
        .then(function(dl){
            companyState.dataValues.directorList = dl;
            return transaction.save()
        })
        .then(() => {
            return Promise.join(AddressService.normalizeAddress(data.afterAddress), AddressService.normalizeAddress(data.beforeAddress))
        })
        .spread((afterAddress, beforeAddress) => {
            return companyState.replaceDirector({name: data.beforeName, address: beforeAddress, personId: data.personId, attr: data.personAttr},
                                         {name: data.afterName, address: afterAddress, personId: data.personId, attr: data.personAttr}, transaction, userId);
        })
        .then(() => {
            return transaction;
        })
        .catch((e) => {
            sails.log.error(e);
            throw new sails.config.exceptions.InvalidOperation('Could not update director');
        });
};

export function performHistoricHolderChange(data, nextState, previousState, effectiveDate, userId){
    if(!data.beforeHolder.personId){
        throw new sails.config.exceptions.InvalidOperation('Historic holder change requires a personId');
    }
    const transaction = Transaction.build({type: data.transactionType, data: data, effectiveDate: effectiveDate})
    return nextState.getHistoricPersonList()
        .then(function(historicPersonList){
            if(!historicPersonList){
                return HistoricPersonList.build({persons: []}, {include: [{model: Person, as: 'persons'}]});
            }
            return historicPersonList.buildNext();
        })
        .then(function(historicPersonList){
            historicPersonList.dataValues.persons = _.reject(historicPersonList.dataValues.persons, (p) => p.isEqual(data.beforeHolder));
            historicPersonList.dataValues.persons.push(PersonService.buildFull(userId, {...data.beforeHolder, ...data.afterHolder, transaction}));
            return historicPersonList.save();
        })
        .then((historicPersonList) => {
            nextState.dataValues.historicPersonList = historicPersonList;
            nextState.set('h_person_list_id', historicPersonList.dataValues.id)
            return transaction;
        })
}

export function performInverseSeed(data, nextState, previousState, effectiveDate){
    return Promise.resolve(Transaction.build({type: Transaction.types.SEED, effectiveDate: effectiveDate || new Date()}));
}

/**
    Seed is a special cause, it doesn't care about previousState
*/
export function performSeed(args, company, effectiveDate, userId){
    let state;
    if(!args.holdingList.holdings || !args.holdingList.holdings.length) {
        throw new sails.config.exceptions.ValidationException('Holdings are required');
    }
    /*
    if(args.unallocatedParcels){
        data.unallocatedParcels = args.unallocatedParcels
    }*/


    return company.getCurrentCompanyState()
        .then(function(companyState){
            var fields = companyState ? companyState.nonAssociativeFields() : {};
            return CompanyState.createDedup(_.merge({}, fields, args, {transaction:{type: Transaction.types.SEED, effectiveDate: effectiveDate || new Date()}}), userId);
        })
        .then(function(_state){
            state = _state;
            return company.setSeedCompanyState(state);
        })
        .then(function(){
            return SourceData.create({data: args, source: 'Companies Office'})
        })
        .then(function(sourceData){
            return company.setSourceData(sourceData);
        })
        .then(function(){
            return company.setCurrentCompanyState(state)
        })
        .then(function(){
            return addActions(state, {
                id: uuid.v4(),
                transactionType: Transaction.types.SEED,
                effectiveDate: effectiveDate || new Date(),
                actions:[{transactionType: Transaction.types.SEED}] }, company)
        })
        .then(function(state){
            return state.save();
        })
        .then(function(){
            return company.save();
        });
}


export function removeDocuments(state, actions){
    const ids = _.filter(_.map(actions, 'sourceUrl'))
    if(ids.length){
        return state.getDocList()
            .then(function(dl){
                if(!dl){
                    return DocumentList.build({documents: []})
                }
                return dl.buildNext();
            })
            .then(function(dl){
                dl.dataValues.documents = dl.dataValues.documents.filter(d => {
                    return ids.indexOf(d.sourceUrl) >= 0;
                });
                return dl.save()
            })
            .then(function(dl){
                state.set('doc_list_id', dl.dataValues.id)
                state.dataValues.docList = dl;
                return state;
            })
    }
    return state;
}

export function addDocuments(state, documents){
    // TODO, make better inverse of above
    return state.getDocList()
        .then(function(dl){
            if(!dl){
                return DocumentList.build({documents: []})
            }
            return dl.buildNext();
        })
        .then(function(dl){
            dl.dataValues.documents = dl.dataValues.documents.concat(documents);
            return dl.save()
        })
        .then(function(dl){
            state.set('doc_list_id', dl.dataValues.id);
            state.dataValues.docList = dl;
            return state;
        })
}


export function addActions(state, actionSet, company){
    return state.getHistoricActions()
        .then(function(hA){
            const data = {id: actionSet.id, data: actionSet}
            if(hA){
                data.previous_id = hA.id;
                return data;
            }
            else{
                return state.getPreviousCompanyState()
                    .then(prev => {
                        if(prev){
                            data.previous_id = prev.get('historic_action_id');
                        }
                        else{
                            data.previous_id = state.get('pending_historic_action_id');
                        }
                        return data;
                    });
            }
        })
        .then(data => {
            return Action.create(data);
        })
        .then(function(hA){
            state.set('historic_action_id', hA.id)
            state.dataValues.historicActions = hA;
            return state;
        })
}

function cleanupCompanyState(state, effectiveDate){
    if(state.hasEmptyHoldings()){
        let nextState;
        sails.log.info('Removing empty holdings');
        return state.buildNext({previousCompanyStateId: state.dataValues.id})
            .then((_nextState) => {
                nextState = _nextState;
                return nextState.dataValues.holdingList.buildNext()
            })
            .then(holdingList => {
                nextState.dataValues.holdingList = holdingList;
                nextState.dataValues.h_list_id = null;
                holdingList.dataValues.holdings = _.filter(holdingList.dataValues.holdings, h => !h.hasEmptyParcels());
                const tran = Transaction.buildDeep({
                    type: Transaction.types.COMPOUND_REMOVALS,
                    data: {},
                    effectiveDate
                });
                return tran.save();
            })
            .then((transaction) => {
                nextState.dataValues.transactionId =null;
                nextState.dataValues.transaction = transaction;
                return nextState.save()
            })
            .then(() => nextState)
            .then(() => {
                return nextState;
            });
    }
    return state;
}


export function performImplicitInverseRemovals(actions, companyState){
    const removals = actions.filter(a => {
        return (a.transactionMethod === Transaction.types.AMEND &&
                                               (a.parcels.reduce((sum, p) => sum + p.afterAmount, 0) === 0));
    });
    let prevState;
    if(removals.length){
        sails.log.info('Performing implicit inverse removals');
        return companyState.save()
            .then(() => {
                return companyState.buildPrevious({transaction: null, transactionId: null})
            })
            .then((_prevState) => {
                prevState = _prevState;
                return prevState.dataValues.holdingList.buildNext()
            })
            .then(function(holdingList){
                prevState.dataValues.h_list_id = null;
                prevState.dataValues.holdingList = holdingList;
                return Promise.all(removals.map(action => {
                    return CompanyState.populatePersonIds(action.holders || action.afterHolders)
                    .then(function(personData){
                        if(!personData.length){
                            throw new sails.config.exceptions.InvalidInverseOperation('Allocation missing holders');
                        }
                        const holding = Holding.buildDeep({
                                holders: personData.map(p => ({person: p})), holdingId: action.holdingId,
                                parcels: []});

                        prevState.dataValues.holdingList.dataValues.holdings.push(holding);
                    })
                }))
                .then(() => {
                    return prevState.save();
                })
                .then(() => {
                    return companyState.setPreviousCompanyState(prevState);
                })
                .then(() => {
                    return prevState;
                })
            })
    }
    else{
        return Promise.resolve(companyState)
    }
}

export function performInverseTransaction(data, company, rootState){

    const PERFORM_ACTION_MAP = {
        [Transaction.types.SEED]:  TransactionService.performInverseSeed,
        [Transaction.types.AMEND]:  TransactionService.performInverseAmend,
        [Transaction.types.HOLDING_CHANGE]:  TransactionService.performInverseHoldingChange,
        [Transaction.types.HOLDING_TRANSFER]:  TransactionService.performInverseHoldingTransfer,
        [Transaction.types.HOLDER_CHANGE]:  TransactionService.performInverseHolderChange,
        [Transaction.types.ISSUE]:  TransactionService.performInverseIssue,
        [Transaction.types.SUBDIVISION]:  TransactionService.performInverseIssue,
        [Transaction.types.CONVERSION]:  TransactionService.performInverseConversion,
        [Transaction.types.ACQUISITION]:  TransactionService.performInverseAcquisition,
        [Transaction.types.CONSOLIDATION]:  TransactionService.performInverseConsolidation,
        [Transaction.types.PURCHASE]:  TransactionService.performInversePurchase,
        [Transaction.types.REDEMPTION]:  TransactionService.performInverseRedemption,
        [Transaction.types.CANCELLATION]:  TransactionService.performInverseCancellation,
        [Transaction.types.NEW_ALLOCATION]:  TransactionService.performInverseNewAllocation,
        //[Transaction.types.REMOVE_ALLOCATION]: TransactionService.performInverseRemoveAllocation,
        [Transaction.types.NAME_CHANGE]: TransactionService.performInverseNameChange,
        [Transaction.types.ADDRESS_CHANGE]: TransactionService.performInverseAddressChange,
        [Transaction.types.USER_FIELDS_CHANGE]: TransactionService.performInverseDetailsChange,
        [Transaction.types.DETAILS]: TransactionService.performInverseDetailsChange,
        [Transaction.types.NEW_DIRECTOR]: TransactionService.performInverseNewDirector,
        [Transaction.types.REMOVE_DIRECTOR]: TransactionService.performInverseRemoveDirector,
        [Transaction.types.UPDATE_DIRECTOR]: TransactionService.performInverseUpdateDirector,
        [Transaction.types.ANNUAL_RETURN]: TransactionService.performAnnualReturn
    };

    if(!data || !data.actions || data.userSkip){
        return Promise.resolve(rootState);
    }
    validateTransactionSet(data, rootState);

    let prevState, currentRoot, transactions;

    const actions = data.actions.filter(a => !a.userSkip);
    if(!actions.length){
        return Promise.resolve(rootState);
    }
    return (rootState ? Promise.resolve(rootState) : company.getRootCompanyState())
        .then((_prevState) => {
            return performImplicitInverseRemovals(actions, _prevState)
        })
        .then(function(_rootState){
            currentRoot = _rootState;
            // build previous state, new records if SEED
            return currentRoot.buildPrevious({transaction: null, transactionId: null}, {newRecords: data.transactionType === Transaction.types.SEED});
        })
        .then(function(_prevState){
            prevState = _prevState;
            // loop over actions,
            return Promise.reduce(actions, function(arr, action){
                sails.log.info('Performing inverse action: ', JSON.stringify(action, null, 4), data.effectiveDate, data.documentId);
                let result;
                const method = action.transactionMethod || action.transactionType;
                if(session.get('options')){
                    session.set('index', session.get('index') + 1);
                }
                if(PERFORM_ACTION_MAP[method]){
                    result = PERFORM_ACTION_MAP[method]({
                        ...action, documentId: data.documentId
                    }, prevState, currentRoot, data.effectiveDate, company.get("ownerId"));
                }
                if(result){
                    return result
                    .then(function(r){
                        if(r){
                            arr = arr.concat(Array.isArray(r) ? r : [r]);
                        }
                        return arr;
                    });
                }
                return arr;
            }, []);

        })
        .then(function(transactions){
            if(!transactions.length && data.actions.every(a => a.IGNORABLE)){
                throw sails.config.exceptions.NoValidTransactions()
            }
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
            //return removeDocuments(prevState, data.actions);
        })
        .then(function(){
            return prevState.save();
        })
        .then(function(_prevState){
            return currentRoot.setPreviousCompanyState(_prevState);
        })
        .then(function(){
            if(data.transactionType === Transaction.types.SEED){
                return company.setSeedCompanyState(currentRoot);
            }
        })
        .then(function(){
            return prevState;
        })
         .catch(sails.config.exceptions.NoValidTransactions, () => {
            return rootState;
         })
}

export function performInverseAll(company, state){
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
    function loop(actions){
        // transaction is not bound to cls ns
        return sequelize.transaction(function(t){
            return new Promise((resolve, reject) => {
                session.run(() => {
                    session.set('index', 0);
                    session.set('options', options);
                    return Promise.each(actions, function(actionSet){
                        return TransactionService.performInverseTransaction(actionSet, company, state)
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
                return loop(actions);
            }
        });
    }
    return sequelize.transaction(function(t){
            return Promise.resolve(state || company.getCurrentCompanyState())
            .then(state => state.getPendingHistoricActions())
        })
        .then(historicActions => historicActions && loop(historicActions.actions))
        .then(function(){
            console.timeEnd('transactions');
        });
}

export function performInverseAllPendingResolve(company, root, endCondition){

    // Loop though data
    // If an exception is found, rollback, and increment permutation for
    // ambigious options.  give up after completion of breadth first search
    // TODO, switch to depth first
    let state = root, current;
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

    function loop(actions){
        // transaction is not bound to cls ns
        return sequelize.transaction(function(t){
            return new Promise((resolve, reject) => {
                state.set('historic_action_id', state.get('pending_historic_action_id'));
                session.run(() => {
                    session.set('index', 0);
                    session.set('options', options);
                    return Promise.each(actions, (actionSet, i) => {
                        return TransactionService.performInverseTransaction(actionSet.data, company, state)
                            .then(_state => {
                                state = _state;
                                state.set('pending_historic_action_id', (actions[i+1] || {}).id ||  actionSet.previous_id);
                                return state.save(['pending_historic_action_id'])
                            })
                    })
                    .then(resolve)
                    .catch(reject)
                });
            });
        })
        .catch(e => {
            sails.log.error('Auto resolve conflict found, starting over');
            if(!next()){
                throw e;
            }
            else{
                return company.getRootCompanyState()
                    .then(_state => {
                        state = _state;
                        return loop(actions);
                });
            }
        });
    }
    return company.getRootCompanyState()
        .then(_state => {
            state = _state;
            return company.getPendingActions()
        })
        .then(historicActions => {
            if(endCondition){
                let finished = false;
                historicActions = historicActions.reduce((acc, hA) => {
                    if(!finished){
                        acc.push(hA);
                    }
                    finished = finished || endCondition(hA);
                    return acc;
                }, []);
            }
            return historicActions.length && loop(historicActions)
        })
        .then((result) => {
            sails.log.error('Resolve Complete');
            return result;
        })
}




export function performInverseAllPendingUntil(company, endCondition, autoResolve=true){
    // unlike above this will commit all successful transactions, and complain when one fails
    let state, current, firstError;

    function perform(actions){
        return Promise.each(actions, (actionSet, i) => {
            return sequelize.transaction(function(t){
                state.set('historic_action_id', state.get('pending_historic_action_id'));
                current = actionSet;
                    return TransactionService.performInverseTransaction(actionSet.data, company, state)
                })
                .then(_state => {
                    state = _state;
                    state.set('pending_historic_action_id', (actions[i+1] || {}).id || actionSet.previous_id);
                    return state.save(['pending_historic_action_id'])
                })
            })
            .catch(sails.config.exceptions.AmbiguousInverseOperation, e => {
                if(!autoResolve){
                    throw e;
                }
                sails.log.error('Ambiguous Transaction found, switching to automatic resolve mode');
                firstError = e;
                firstError.context = firstError.context || {};
                firstError.context.actionSet = current;

                return Promise.all([state.fullPopulateJSON(true)])
                    .spread((fullState) => {
                        firstError.context.companyState = fullState;
                        return performInverseAllPendingResolve(company, null, (doc) => doc.data.transactionType === Transaction.types.ANNUAL_RETURN);
                    })
            })
            .catch(e => {
                sails.log.error(e)
                sails.log.error('Failed import on action: ', JSON.stringify(current));
                if(firstError){
                    throw firstError;
                }
                else{
                    e.context = e.context || {};
                    e.context.actionSet = current;
                    if(e.context.companyState){
                        return e.context.companyState.fullPopulateJSON(true)
                            .then(function(fullState) {
                                e.context.companyState = fullState;
                                throw e;
                            })
                    }
                    throw e;
                }
            })
    }

    return sequelize.transaction(function(t){
        return company.getRootCompanyState()
            .then(_state => {
                state = _state;
                return company.getPendingActions()
            })
        })
        .then(historicActions => {
            if(endCondition){
                let finished = false;
                historicActions = historicActions.reduce((acc, hA) => {
                    if(!finished){
                        acc.push(hA);
                    }
                    finished = finished || endCondition(hA);
                    return acc;
                }, []);
            }
            return historicActions.length && perform(historicActions)
        })
}

export function performInverseAllPending(company, endCondition, requireConfirmation){
    // if we specify endCondition, it should get there fine, as it will not be before SEED
    return new Promise((resolve, reject) => {
        session.run(() => {
            session.set('REQUIRE_CONFIRMATION', !!requireConfirmation);
            return performInverseAllPendingUntil(company, endCondition, true)
                .then(result => {
                    if(!!result && !endCondition){
                        return performInverseAllPending(company, endCondition);
                    }
                })
                .then(resolve)
                .catch(reject)
            });
        });
}


function validateTransactionSet(data, companyState){
    const shareClasses = {};
    let defaultShareClass = null;
    if(companyState && companyState.shareClasses && companyState.dataValues.shareClasses &&
       companyState.dataValues.shareClasses.dataValues.shareClasses.length === 1){
        defaultShareClass = companyState.dataValues.shareClasses.dataValues.shareClasses[0].id;
    }
    data.actions.map(action => {
        if(!action.userSkip){
            const DIRECTIONS = {
                [Transaction.types.ISSUE]: -1,
                [Transaction.types.SUBDIVISION]: -1,
                [Transaction.types.CONVERSION]: -1,
                [Transaction.types.ISSUE]: -1,
                [Transaction.types.SUBDIVISION]: -1,
                [Transaction.types.CONVERSION]: -1,
                [Transaction.types.REDEMPTION]:-1,
                [Transaction.types.ACQUISITION]: -1,
                [Transaction.types.CONSOLIDATION]:-1,
                [Transaction.types.CANCELLATION]:-1,
                [Transaction.types.PURCHASE]: -1,
                [Transaction.types.APPLY_SHARE_CLASS]: 0
            };

            (action.parcels || []).map(p => {
                const shareClass = p.shareClass = p.shareClass || defaultShareClass;
                shareClasses[shareClass] = shareClasses[shareClass] || 0;
                if(p.afterAmount !== undefined && p.beforeAmount !== undefined){
                    shareClasses[shareClass] += (DIRECTIONS[action.transactionType] || 1) * (p.afterAmount - p.beforeAmount);
                }
                else if(p.amount){
                    shareClasses[shareClass] += (DIRECTIONS[action.transactionType] !== undefined ? DIRECTIONS[action.transactionType] : 1) * (p.amount);
                }
            });
        }
    });
    if(!Object.keys(shareClasses).every(shareClass => shareClasses[shareClass] === 0)){
        throw new sails.config.exceptions.InvalidInverseOperation('Total share count is unbalanced', {
            importErrorType: sails.config.enums.UNBALANCED_TRANSACTION,
            companyState: companyState,
            actionSet: data
        });
    }
}


export function performTransaction(data, company, companyState, resultingTransactions, isReplay){

    const PERFORM_ACTION_MAP = {
        [Transaction.types.ISSUE]:                  TransactionService.performIssue,
        [Transaction.types.ACQUISITION]:            TransactionService.performAcquisition,
        [Transaction.types.PURCHASE]:               TransactionService.performPurchase,
        [Transaction.types.CONSOLIDATION]:          TransactionService.performConsolidation,
        [Transaction.types.REDEMPTION]:             TransactionService.performRedemption,
        [Transaction.types.CANCELLATION]:           TransactionService.performCancellation,
        [Transaction.types.AMEND]:                  TransactionService.performAmend,
        [Transaction.types.NAME_CHANGE]:            TransactionService.performNameChange,
        [Transaction.types.DETAILS]:                TransactionService.performDetailsChange,
        [Transaction.types.USER_FIELDS_CHANGE]:     TransactionService.performDetailsChange,
        [Transaction.types.ADDRESS_CHANGE]:         TransactionService.performAddressChange,
        [Transaction.types.HOLDING_CHANGE]:         TransactionService.performHoldingChange,
        [Transaction.types.HOLDER_CHANGE]:          TransactionService.performHolderChange,
        [Transaction.types.HOLDING_TRANSFER]:       TransactionService.performHoldingTransfer,
        [Transaction.types.NEW_ALLOCATION]:         TransactionService.performNewAllocation,
        //[Transaction.types.REMOVE_ALLOCATION]:      TransactionService.performRemoveAllocation,
        [Transaction.types.NEW_DIRECTOR]:           TransactionService.performNewDirector,
        [Transaction.types.REMOVE_DIRECTOR]:        TransactionService.performRemoveDirector,
        [Transaction.types.UPDATE_DIRECTOR]:        TransactionService.performUpdateDirector,
        [Transaction.types.APPLY_SHARE_CLASS]:      TransactionService.performApplyShareClass,
        [Transaction.types.HISTORIC_HOLDER_CHANGE]: TransactionService.performHistoricHolderChange
    };

    if(!data.actions || data.userSkip){
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
    if(!data.id){
        data.id = uuid.v4();
    }
    validateTransactionSet(data, companyState);

    let nextState, current, transactions;
    const effectiveDate = data.effectiveDate || new Date();
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
                sails.log.info('Performing action: ', JSON.stringify(action, null, 4), data.effectiveDate, data.documentId, isReplay);
                let result;
                const method = action.transactionMethod || action.transactionType;
                if(PERFORM_ACTION_MAP[method]){
                    result = PERFORM_ACTION_MAP[method]({
                        ...action, documentId: data.documentId
                    }, nextState, current, effectiveDate, company.get("ownerId"), isReplay);
                }
                if(result){
                    return result.then(function(r){
                        if(r){
                            arr = arr.concat(Array.isArray(r) ? r : [r]);
                        }
                        return arr;
                    });
                }
                return arr;
            }, [])

        })
        .then(function(transactions){
            const tran = Transaction.buildDeep({
                    type: data.transactionType || Transaction.types.COMPOUND,
                    data: _.omit(data, 'actions', 'transactionType', 'effectiveDate', 'documents'),
                    effectiveDate: effectiveDate,
            });
            tran.dataValues.childTransactions = _.filter(transactions);
            return tran.save();
        })
        .then(function(transaction){
            if(resultingTransactions){
                resultingTransactions.push(transaction);
            }
            nextState.dataValues.transaction = transaction;
            if(data.documents && data.documents.length){
                return transaction.setDocuments(data.documents)
                    .then(function(){
                        //return addDocuments(nextState, data.documents);
                    })
            }
        })
        .then(() => {
            return addActions(nextState, {...data, document_ids: (data.documents || []).map(d => d.id), documents: null}, company)
        })
        .then(function(){
            return nextState.save();
        })
        .then(state => cleanupCompanyState(nextState, effectiveDate))
        .then(function(_nextState){
            nextState = _nextState;
            return company.setCurrentCompanyState(nextState);
        })
        .then(function(){
            return company.save();
        })
        .then(function(){
            return nextState;
        })
}


export function performAll(data, company, state, isReplay, resultingTransactions){
    return Promise.each(data, function(doc){
        return TransactionService.performTransaction(doc, company, state, resultingTransactions, isReplay)
            .then(_state => {
                state = _state;
            })
            .catch(e => {
                sails.log.error(e);
                if(isReplay){
                    throw sails.config.exceptions.FutureTransactionException('There is a conflict with a scheduled transaction', {
                        actionSet: doc
                    })
                }
                throw e;
            })
    })
    .then(() => {
        return state;
    })
}

export function transactionsToActions(transactions){
    return transactions.map(t => {
        const {id, subTransactions, data, ...info} = t;
        return {...info, ...data, id: null, transactionType: t.type, originalTransactionId: id, actions: (t.subTransactions || []).map(s => {
            const {id,  parentTransactionId, data, ...info} = s;
            return {...info, ...data, id: null};
        })}
    })
}


export function performAllInsertByEffectiveDate(data, company){
    const date = data[0].effectiveDate;
    let state, futureTransactions;
    let completedTransactions = [];
    return company.getDatedCompanyState(date)
        .then(_state => {
            state = _state;
            return company.getTransactionsAfter(state.id)
        })
        .then(_transactions => {
            futureTransactions = _transactions;
            return performAll(data, company, state, false, completedTransactions)
        })
        .then((state) => {
            const implicit = createImplicitTransactions(state, data, date);
            if(implicit.length){
                return performAll(implicit, company, state)
            }
            return state;
        })
        .then(state => {
            if(futureTransactions.length){
                return performAll(transactionsToActions(futureTransactions), company, state, true)
            }
            return state;
        })
        .then(state => {
            return {companyState: state, transaction: completedTransactions[0]}
        });
}

export function performFilterOutTransactions(transactionIds, company){
    const date = new Date()
    let state, futureTransactions;
    // can only filter out from the future
    return company.getDatedCompanyState(date)
        .then(_state => {
            state = _state;
            return company.getTransactionsAfter(state.id)
        })
        .then(_transactions => {
            // better remove other transactions from the same meta set (usually compound removes)
            const transactionSets = {};
            futureTransactions = _transactions;
            futureTransactions.map(t => {
                if(transactionIds.indexOf(t.id) >= 0 && t.data && t.data.transactionSetId){
                    transactionSets[t.data.transactionSetId] = true;
                }
            })
            futureTransactions = futureTransactions.filter(f => transactionIds.indexOf(f.id) === -1 && !transactionSets[f.data.transactionSetId]);
            if(futureTransactions.length){
                return performAll(transactionsToActions(futureTransactions), company, state, true)
            }
            else{
                return company.setCurrentCompanyState(state);
            }
        })
        .then(() => {
            return state;
        });
}

export function createImplicitTransactions(state, transactions, effectiveDate){
    // remove empty allocations
    function removeEmpty(){
        const actions = state.dataValues.holdingList.dataValues.holdings.reduce((acc, holding) => {
            if(!holding.hasNonEmptyParcels()){
                acc.push({
                    transactionType: Transaction.types.REMOVE_ALLOCATION,
                    holdingId: holding.holdingId,
                    holders: holding.holders.map(h => h.holderInfo())
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
        return [];
    }

    function replaceHolders(){
        const newActions = []
        transactions.map(tran => {
            tran.actions.map(action => {
                if(action.transactionType !== Transaction.types.UPDATE_DIRECTOR){
                    return;
                }
                if(state.getHolderBy({name: action.beforeName, address: action.beforeAddress, personId: action.personId})){
                    newActions.push({
                        beforeHolder: {
                            name: action.beforeName,
                            address: action.beforeAddress,
                            personId: action.personId,
                        },
                        afterHolder: {
                            name: action.afterName,
                            address: action.afterAddress
                        },
                        transactionType: Transaction.types.HOLDER_CHANGE,
                        effectiveDate: effectiveDate
                    })
                }
            })
        });
        if(newActions.length){
            return [{
                transactionType: Transaction.types.INFERRED_HOLDER_CHANGE,
                actions: newActions,
                effectiveDate: effectiveDate
            }]
        }
        return [];
    }

    function replaceDirectors(){
        const newActions = []
        transactions.map(tran => {
            tran.actions.map(action => {
                if(action.transactionType !== Transaction.types.HOLDER_CHANGE){
                    return;
                }
                if(state.getDirectorBy({name: action.beforeHolder.name, address: action.beforeHolder.address, personId: action.beforeHolder.personId})){
                    newActions.push({
                        beforeName: action.beforeHolder.name,
                        afterName: action.afterHolder.name,
                        beforeAddress: action.beforeHolder.address,
                        afterAddress: action.afterHolder.address,
                        personId: action.beforeHolder.personId,
                        transactionType: Transaction.types.UPDATE_DIRECTOR,
                        effectiveDate: effectiveDate
                    })
                }
            })
        });
        if(newActions.length){
            return [{
                transactionType: Transaction.types.INFERRED_UPDATE_DIRECTOR,
                actions: newActions,
                effectiveDate: effectiveDate
            }]
        }
        return [];
    }
    // HOLDING CHANGES NEED TO HAVE A REMOVE
    return [ ...replaceDirectors(), ...replaceHolders()]
}
