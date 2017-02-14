import { enums as TransactionTypes } from '../../../../config/enums/transactions';
import {  actionAmountDirection } from '../transactions/resolvers/summaries';
import { numberWithCommas } from '../../utils';
import moment from 'moment';

export const keyObject = { keyIndex: 1};
export const UNREPORTED_TRANSACTION = 'UNREPORTED_TRANSACTION';

function findHolding(companyState, action, existing = []){
    // same names, forget addresses for now
    function personsMatch(h1, h2){
        const h2Names = h2.map(h => h.name.toLowerCase());
        return h1.every(p => h2Names.indexOf(p.name.toLowerCase()) >= 0)
    }

    function parcelsMatch(p1, p2){
        // forget shareClass for now
        const sum1 = p1.reduce((sum, p) => sum+p.amount, 0);
        const sum2 = p2.reduce((sum, p) => sum+p.amount, 0);
        return sum1 === sum2;
    }
    return companyState.holdingList && companyState.holdingList.holdings.filter(h => {
        return personsMatch(action.afterHolders || action.holders, h.holders.map(h => h.person)) &&
                parcelsMatch(action.parcels.map(p => ({amount: p.afterAmount, shareClass: p.shareClass})), h.parcels) &&
                existing.indexOf(h) < 0
    })[0];
}


const isAmendable = (action) => [TransactionTypes.AMEND, TransactionTypes.NEW_ALLOCATION].indexOf(action.transactionMethod || action.transactionType) >= 0; // && !action.inferAmount;

export function collectAmendActions(actions){ return  actions.filter(isAmendable) };

export function guessAmendAfterAmounts(action, defaultShareClass, companyState){
    const holding = companyState && findHolding(companyState, action);
    if(holding){
        return holding.parcels.map(parcel => ({amount: parcel.amount, shareClass: parcel.shareClass + ''}))
    }
    return action.parcels.map(parcel => ({amount: parcel.afterAmount, shareClass:  (parcel.shareClass || defaultShareClass) + ''}))
}



export function isTransfer(type){
    return [TransactionTypes.TRANSFER_FROM, TransactionTypes.TRANSFER_TO].indexOf(type) >= 0;
}

function inverseTransfer(type){
    return type === TransactionTypes.TRANSFER_FROM ? TransactionTypes.TRANSFER_TO : TransactionTypes.TRANSFER_FROM;
}

export function signedAmount(type, amount){
    if(!type){
        return amount;
    }
    if([TransactionTypes.ISSUE_TO, TransactionTypes.TRANSFER_TO, TransactionTypes.CONVERSION_TO].indexOf(type) >- 1){
        return amount;
    }
    return Number.isInteger(amount) ? -amount : 0;
}

export function isIncrease(type) {
    return [TransactionTypes.ISSUE_TO,
    TransactionTypes.TRANSFER_TO,
    TransactionTypes.CONVERSION_TO].indexOf(type) > -1
}


function validTransactionType(type){
    return [
        TransactionTypes.ISSUE_TO,
        TransactionTypes.TRANSFER_TO,
        TransactionTypes.CONVERSION_TO,
        TransactionTypes.TRANSFER_FROM,
        TransactionTypes.PURCHASE_FROM,
        TransactionTypes.REDEMPTION_FROM,
        TransactionTypes.ACQUISITION_FROM,
        TransactionTypes.CONSOLIDATION_FROM,
        TransactionTypes.CANCELLATION_FROM,
        ].indexOf(type) >= 0 ? type : '';
}

export function formatInitialState(amendActions, defaultDate, defaultShareClass, companyState, actionSetId){
    const identity = x => x;
    const allSameDirectionSum = amendActions.reduce((acc, action) => {
        return acc + (actionAmountDirection(action) ? 1 : 0)
    }, 0);

    const allSameDirection = allSameDirectionSum === 0 || allSameDirectionSum === amendActions.length;
    const allButOneIncrease = amendActions.length > 2 && !allSameDirection && allSameDirectionSum === amendActions.length -1;
    const allButOneDecrease = amendActions.length > 2 && !allSameDirection && allSameDirectionSum === 1;

    const amountValues = amendActions.reduce((acc, action, i) => {
        const dir = (action.parcels[0].afterAmount > action.parcels[0].beforeAmount || !action.beforeHolders);
        action.parcels.map(parcel => {
            acc[dir][parcel.amount] = (acc[dir][parcel.amount] || []).concat({...action, id: action.id});
        });
        return acc;
    }, {true: {}, false: {}});

    let initialValues = {actions: calculateReciprocals(amendActions.map((a, i) => {
        // if all same direction, set amount;
        const effectiveDate = moment(a.effectiveDate || defaultDate).toDate();
        let amount, holding;
        if(allSameDirection){
            return {
                subActions: [{parcels:  a.parcels.map(parcel => ({amount:  a.inferAmount ? 'All' : parcel.amount, shareClass: (parcel.shareClass || defaultShareClass)+''})),
                targetActionSet: actionSetId,
                effectiveDate,  _keyIndex: keyObject.keyIndex++, type: validTransactionType(a.transactionType || a.transactionMethod)}]
            };
        }
        // else if one exact opposite transaction, then set that
        const increase =  actionAmountDirection(a);
        if(a.parcels.every(p => amountValues[increase][p.amount] && amountValues[increase][p.amount].length === 1 &&
           amountValues[!increase][p.amount] && amountValues[!increase][p.amount].length === 1)){
            return {subActions: [{
                parcels:  a.parcels.map(parcel => ({amount:  a.inferAmount ? 'All' : parcel.amount, shareClass: (parcel.shareClass || defaultShareClass)+''})),
                type: increase ? TransactionTypes.TRANSFER_TO : TransactionTypes.TRANSFER_FROM,
                holding: amountValues[!increase][a.parcels[0].amount][0].id,
                effectiveDate,
                isInverse: !increase,
                _keyIndex: keyObject.keyIndex++
            }]};
        }
        let inverse;
        if(allButOneIncrease){
            // if all but one increase, then we know the other party in the transaction
            // inverse will be created
            holding = amountValues[!increase][Object.keys(amountValues[!increase])[0]][0].id;
            inverse = holding && !increase;
        }

        if(allButOneDecrease){
            holding = amountValues[!increase][Object.keys(amountValues[!increase])[0]][0].id;
            inverse = holding && increase;
        }


        return {
            subActions: [{
                targetActionSet: actionSetId,
                parcels:  a.parcels.map(parcel => ({amount:  a.inferAmount ? 'All' : parcel.amount, shareClass: (parcel.shareClass || defaultShareClass)+''})),
                type: validTransactionType(a.transactionType) , effectiveDate, _keyIndex: keyObject.keyIndex++, holding, isInverse: inverse
        }]};
    }).filter(identity).map((a, i) => ({
        ...a,
        data: amendActions[i],
        userSkip: amendActions[i].userSkip,
        afterParcels: guessAmendAfterAmounts(amendActions[i], defaultShareClass, companyState)
    })), identity, identity, x => false)};

    return initialValues;
}


export function formatSubmit(values, actionSet, externalActions = []) {
    actionSet = actionSet || {data: {actions: []}};
    const amendActions = collectAmendActions(actionSet.data.actions);
    const amends = [...(values.actions.map((a, i) => ({...amendActions[i]})))];
    const otherActions = actionSet.data.actions.filter(a => !isAmendable(a))
    const pendingActions = [{id: actionSet.id, data: {...actionSet.data, actions: otherActions}, previous_id: actionSet.previous_id}];

    const nonTransfers = {};
    const transfers = []
    const transplantActions = [];

    values.actions.map((a, i) => {

        !a.userSkip && a.subActions.map((r, j) => {
            if(!r.isInverse){
                let method = TransactionTypes.AMEND;
                const parcels = r.parcels.map(p => ({amount: parseInt(p.amount, 10), shareClass: parseInt(p.shareClass, 10) || null}))
                const holders = amends[i].afterHolders || amends[i].holders;
                if(isTransfer(r.type)){
                    const result = {...amends[i], beforeHolders: holders, afterHolders: holders, transactionType: r.type,
                        transactionMethod: method, parcels, effectiveDate: r.effectiveDate, _holding: i, userConfirmed: true};
                    const holdingIndex = values.actions.findIndex(a => a.data.id === r.holding)
                    const inverseHolders = amends[holdingIndex].afterHolders || amends[holdingIndex].holders;
                    const inverse = {...amends[holdingIndex], beforeHolders: inverseHolders, afterHolders: inverseHolders,
                        transactionType: inverseTransfer(r.type), parcels, transactionMethod: method, effectiveDate: r.effectiveDate, _holding: holdingIndex, userConfirmed: true}
                    transfers.push([result, inverse])
                }
                else{
                    const result = {...amends[i], beforeHolders: holders, afterHolders: holders, transactionType: r.type,
                        transactionMethod: method, parcels, effectiveDate: r.effectiveDate, _holding: i, userConfirmed: true};
                    if(r.targetActionSet && r.targetActionSet !== UNREPORTED_TRANSACTION && actionSet.id !== r.targetActionSet && externalActions.length){
                        const target = externalActions.find(a => a.id === r.targetActionSet);
                        transplantActions.push({targetActionSet: r.targetActionSet, action: {...result, isTransplant: true, effectiveDate: target.effectiveDate}});
                    }
                    else if(r.targetActionSet && r.targetActionSet === UNREPORTED_TRANSACTION){

                    }
                    else{
                        nonTransfers[r.effectiveDate] = nonTransfers[r.effectiveDate] || [];
                        nonTransfers[r.effectiveDate].push(result);
                    }
                }
            }
        });
    });

    const transactions = transfers;

    Object.keys(nonTransfers).map(date => {
        transactions.push(nonTransfers[date]);
    });

    transplantActions.map(transplant => {
        transactions.push([transplant]);
    });

    // sort by date
    transactions.sort((a, b) => {
        return b[0].effectiveDate - a[0].effectiveDate
    });

    const newAllocations = {};

    const parcelIndexByClass = (parcels, shareClass) => {
        return parcels.findIndex(p =>  !p.shareClass || shareClass === p.shareClass);
    }
    transactions.map((actions, i) => {
        actions.map(action => {
            if(action._holding !== undefined && amends[action._holding].parcels){
                //look up original action
                const original = amends[action._holding];
                action.parcels = action.parcels.map(p => {
                    p = {...p}
                    const parcelIndex = parcelIndexByClass(original.parcels, p.shareClass);
                    // if share class has changed.....
                    p.afterAmount = original.parcels[parcelIndex].afterAmount;
                    p.beforeAmount = p.afterAmount + (isIncrease(action.transactionType) ? -p.amount : p.amount);
                    original.parcels[parcelIndex] = {...original.parcels[parcelIndex]}
                    original.parcels[parcelIndex].afterAmount = p.beforeAmount;
                    return p;
                });
                if(action.parcels.every(p => p.beforeAmount === 0) && (original.transactionMethod || original.transactionType) === TransactionTypes.NEW_ALLOCATION) {
                    newAllocations[action._holding] = action;
                }
                else{
                    delete action.holders;
                }
                delete action._holding;
            }
        });
    });
    // put new allocation types where needed
    Object.keys(newAllocations).map(k => {
        newAllocations[k].transactionMethod = TransactionTypes.NEW_ALLOCATION;
        delete newAllocations[k].afterHolders;
        delete newAllocations[k].beforeHolders;
    });
    transactions.map((actions, orderIndex) => {
        // add orderIndex to transplants
        actions.filter(action => action.isTransplant).map(transplant => {
            transplantActions.find(t => t.action === transplant).orderIndex = orderIndex;
        });
        actions = actions.filter(action => !action.isTransplant);
        pendingActions.push({id: actionSet.id, data: {...actionSet.data, orderIndex: orderIndex, effectiveDate: actions[0].effectiveDate, totalShares: null, actions: actions}, previous_id: actionSet.previous_id});
    });

    return { newActions: pendingActions, transplantActions }
}


export function validateAmend(values, props) {
    const errors = {};
    const formErrors = {};
    errors.actions = values.actions.map((action, i) => {
        const errors = {};
        if(action.userSkip){
            return errors;
        }
        const expectedSum = action.data.parcels.reduce((sum, p) => sum + (p.afterAmount - p.beforeAmount), 0);

        const expectedAfterSum = action.data.parcels.reduce((sum, p) => sum + (p.afterAmount), 0);
        const inferAmount = action.data ? action.data.inferAmount: false;
        const amounts = (action.afterParcels || []).reduce((acc, parcel) => {
            acc[parcel.shareClass || null] = {amount: parseInt(parcel.amount, 10) || 0, sum: 0}
            return acc;
        }, {[null]: {amount: expectedAfterSum, sum: 0}});

        let totalSum = 0;

        const shareClassExists = {};
        let afterParcelSum = 0;
        errors.afterParcels = (action.afterParcels || []).map((p, i) => {
            const errors = {};
            if(!p.shareClass){
                errors.shareClass = ['Required.']
            }
            if(shareClassExists[p.shareClass]){
                errors.shareClass = ['Duplicate Share Class.']
            }
            afterParcelSum += parseInt(p.amount, 10) || 0;
            let diff = afterParcelSum - expectedAfterSum
            if(diff > 0){
                errors.amount = [`${numberWithCommas(diff)} shares over allocated.`]
            }
            else if(diff < 0 && i === action.afterParcels.length-1){
                errors.amount = [`${numberWithCommas(-diff)} shares under allocated.`]
            }
            shareClassExists[p.shareClass] = true;
            return errors;
        })

        // must go in newest to oldest, to reverse twice
        errors.subActions = action.subActions.slice(0).reverse().map((recipient, j) => {
            const errors = {parcels: []};
            const inferred = recipient.parcels.length === 1 && recipient.parcels[0].amount === 'All';

            const actionAmounts = recipient.parcels.reduce((acc, parcel, i) => {
                errors.parcels[i] = {};
                if(acc[parcel.shareClass || null] !== undefined){
                    errors.parcels[i].shareClass = ['Duplicate Share Class.']
                }
                const amount = parseInt(parcel.amount, 10) || 0;
                if(!amount && !inferred){
                    errors.parcels[i].amount = ['Required.']
                }
                else if(amount <= 0 && !inferred){
                    errors.parcels[i].amount = ['Must be greater than 0.'];
                }
                const sourceParcel = (amounts[parcel.shareClass] || amounts[null]);

                if(recipient.type){
                    const absAmount = signedAmount(recipient.type, amount)
                    sourceParcel.sum += absAmount;
                    totalSum += absAmount;
                }
                if((sourceParcel.amount - sourceParcel.sum ) < 0){
                    errors.parcels[i].amount = ['Share count for this class goes below 0.'];
                }

                acc[parcel.shareClass || null] = amount;
                return acc;
            }, {});

            if(!recipient.effectiveDate){
                errors.effectiveDate = ['Required.'];
            }
            if(props.effectiveDate && recipient.effectiveDate && recipient.effectiveDate > props.effectiveDate){
                errors.effectiveDate = ['Effective date must be on or before the date of the document.'];
            }
            if(j < action.subActions.length-1 && (recipient.effectiveDate < action.subActions[j+1].effectiveDate)){
                errors.effectiveDate = errors.effectiveDate || [];
                errors.effectiveDate.push('Effective date cannot be before previous transaction.')
            }

            if(!recipient.type){
                errors.type = ['Required.'];
            }
            if(isTransfer(recipient.type)){
                if(!recipient.holding){
                    errors.holding = ['Transfer shareholding required.'];
                }
            }
            else if(!recipient.targetActionSet){
                errors.targetActionSet = ['Original transaction required.'];
            }
            return errors;
        }).reverse();

        if(!action.subActions.length){
            formErrors.actions = formErrors.actions || [];
            formErrors.actions[i] = ['At least 1 transaction required.'];
        }

        if(!inferAmount && totalSum !== expectedSum){
            const diff = totalSum - expectedSum;
            formErrors.actions = formErrors.actions || [];
            if(diff < 0){
                formErrors.actions[i] = formErrors.actions[i] || [];
                formErrors.actions[i].push(`${numberWithCommas(-diff)} shares left to allocate.`);
            }
            else if(diff > 0){
                formErrors.actions[i] = formErrors.actions[i] || [];
                formErrors.actions[i].push(`${numberWithCommas(diff)} shares over allocated.`);
            }
        }

        return errors;
    });

    errors._error = Object.keys(formErrors).length ? formErrors: null;
    return errors;
}



export function calculateReciprocals(actions, getValue=(x) => x && x.value, setValue=(x) => ({value: x}), getTouched=(x) => x && x.touched) {
    if(!actions){
        return null;
    }

    // removal all reciprocals
    actions = actions.map(action => {
        const subActions = action.subActions.filter(r => !getValue(r.isInverse));
        return {...action, subActions}
    });

    // re add them
    actions.map((action, i) => {
        (action.subActions || []).map((recipient, j) => {
            if(isTransfer(getValue(recipient.type)) && !getValue(recipient.isInverse)){
                const holding = getValue(recipient.holding);

                if(!holding){
                    return;
                }
                const holdingIndex = actions.findIndex(h => getValue(h.data).id === holding);
                if(holdingIndex < 0){
                    return;
                }
                // has a holding, insert inverse transaction
                const inverseType = inverseTransfer(getValue(recipient.type))
                const inverseHolding = getValue(actions[i].data).id;
                // does the reciprocal any fields that have been touched?

                actions[holdingIndex].subActions = actions[holdingIndex].subActions.filter(r => {
                    return getValue(r.userCreated) || (r.parcels.some(p => getTouched(p.amount) || getTouched(p.shareClass)) || getTouched(r.effectiveDate) || getTouched(r.type) || getTouched(r.holding) || getValue(r.isInverse));
                });

                actions[holdingIndex].subActions.push({
                    effectiveDate: recipient.effectiveDate,
                    isInverse: setValue(true),
                    type: setValue(inverseType),
                    holding: setValue(inverseHolding),
                    parcels: recipient.parcels.map(p => ({amount: setValue(getValue(p.amount)), shareClass: setValue(getValue(p.shareClass))})),
                    _keyIndex: setValue('inverse-' + getValue(recipient._keyIndex))
                });

                // better sort reciprocals
                actions[holdingIndex].subActions.sort((a, b) => {
                    return getValue(a.effectiveDate) - getValue(b.effectiveDate)
                });
            }
        })
    });
    return actions;
}
