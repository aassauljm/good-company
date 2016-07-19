const _ = require('lodash');
const moment = require('moment');
const uuid = require('node-uuid');

/* This function is designed to infer whether AMEND, NEW_ALLOCATION
   are actually TRANSFERS or ISSUE/PURCHASES ETC
   We can only infer this that a not ambiguous
   */
module.exports = {
    inferAmendTypes: function(actionSets){
        sails.log.verbose('Inferring amend types');

        const results = [];
        const types = [Transaction.types.AMEND, Transaction.types.NEW_ALLOCATION, Transaction.types.REMOVE_ALLOCATION];

        return _.reduce(actionSets, (acc, d, i) => {
            const needsInference = _.any(d.actions, a => types.indexOf(a.transactionType) >= 0);
            if(needsInference){
                // TODO, read previous share update doc
                //http://www.business.govt.nz/companies/app/ui/pages/companies/2109736/21720672
                function getMatchingDocument(index, matchValue){
                    const MAX_DISTANCE = 24;
                    for(let i=0, j=index-1, neg=-1; i<MAX_DISTANCE; i++, j+=i*neg, neg*=-1){
                        const k = Math.min(Math.max(0, j), actionSets.length-1);
                        if(k === index) continue;
                        if(actionSets[k].totalShares === matchValue){
                            return actionSets[k];
                        }
                    }
                    return null;
                }
                const allocationsUp = _.filter(d.actions, a => types.indexOf(a.transactionType) >= 0 && a.afterAmount > a.beforeAmount).length;
                const allocationsDown = _.filter(d.actions, a => types.indexOf(a.transactionType) >= 0 && a.afterAmount < a.beforeAmount).length;
                // not so simple as sums, see http://www.business.govt.nz/companies/app/ui/pages/companies/2109736/19916274/entityFilingRequirement
                if(d.totalShares === 0 && (allocationsUp === 1 || allocationsDown === 1)){
                    // totalShares = zero SHOULD mean transfers.  Hopefully.
                    d.actions.map(a => {
                        a.transactionMethod = a.transactionType;
                        if(a.transactionType === Transaction.types.NEW_ALLOCATION){
                            a.transactionType = Transaction.types.TRANSFER_TO;
                        }
                        if(a.transactionType === Transaction.types.REMOVE_ALLOCATION){
                            a.transactionType = Transaction.types.TRANSFER_FROM;
                        }
                        else if(a.transactionType === Transaction.types.AMEND){
                            a.transactionType  = a.afterAmount > a.beforeAmount ? Transaction.types.TRANSFER_TO : Transaction.types.TRANSFER_FROM;
                        }
                    })
                }

                else if(d.totalShares > 0 && allocationsDown === 0){
                    const match = getMatchingDocument(i, -d.totalShares);
                    d.actions.map(a => {
                        a.transactionMethod = a.transactionType;
                        if(a.transactionType === Transaction.types.NEW_ALLOCATION ||
                           a.transactionType === Transaction.types.AMEND){
                            if(match){
                                match.actions.map(m => {
                                    switch(m.transactionType){
                                        case Transaction.types.ISSUE:
                                        case Transaction.types.ISSUE_UNALLOCATED:
                                            a.transactionType = Transaction.types.ISSUE_TO;
                                            break;
                                        case Transaction.types.CONVERSION:
                                            a.transactionType = Transaction.types.CONVERSION_TO;
                                            break;
                                        case Transaction.types.SUBDIVISION:
                                            a.transactionType = Transaction.types.SUBDIVISION_TO;
                                            break;
                                    }
                                });
                            }

                        }
                    })
                }

                else if(d.totalShares < 0 && allocationsUp === 0){
                    const match = getMatchingDocument(i, -d.totalShares);
                    d.actions.map(a => {
                        if(a.transactionType === Transaction.types.AMEND || a.transactionType === Transaction.types.REMOVE_ALLOCATION){
                            a.transactionMethod = a.transactionType;
                            if(match){
                                match.actions.map(m => {
                                    switch(m.transactionType){
                                        case Transaction.types.PURCHASE:
                                            a.transactionType = Transaction.types.PURCHASE_FROM;
                                            break;
                                        case Transaction.types.ACQUISITION:
                                            a.transactionType = Transaction.types.ACQUISITION_FROM;
                                            break;

                                        case Transaction.types.CONSOLIDATION:
                                            a.transactionType = Transaction.types.CONSOLIDATIONFROM;
                                            break;
                                        case Transaction.types.REDEMPTION:
                                            a.transactionType = Transaction.types.REDEMPTION_FROM;
                                            break;
                                    }
                                });
                            }
                        }
                    })
                }
                acc.push(d);
            }
            else{
                acc.push(d);
            }
            return acc;

        }, []);
    },

    insertIntermediateActions: function (docs){

        //  split removeAllocations into amend to zero, then removeAllocation.
        function splitAmends(docs){
            const removalTypes = [Transaction.types.REMOVE_ALLOCATION];
            return  _.reduce(docs, (acc, doc, i) => {
                const removalActions = _.filter(doc.actions, a => removalTypes.indexOf(a.transactionMethod || a.transactionType) >= 0);
                if(!removalActions.length){
                    acc.push(doc);
                } else {
                   const amends = _.cloneDeep(doc);
                    doc = _.cloneDeep(doc);
                    amends.actions = removalActions.map(a => {
                        return {
                            effectiveDate: a.effectiveDate,
                            beforeHolders: a.holders,
                            afterHolders: a.holders,
                            afterAmount: 0,
                            amount: a.amount,
                            beforeAmount: a.amount,
                            transactionType: a.transactionType, // TODO, Transfer_from, etc
                            transactionMethod: Transaction.types.AMEND
                        }
                    })
                    doc.actions = doc.actions.filter(a => {
                        if(removalTypes.indexOf(a.transactionMethod || a.transactionType) >= 0){
                            a.transactionType = Transaction.types.REMOVE_ALLOCATION;
                            a.transactionMethod = null;
                            a.amount = 0
                            return a;
                        }
                        else{
                            // if not a removal, then add to amend doc action set
                            amends.actions.unshift(a);
                        }
                    })
                    doc.transactionType = Transaction.types.COMPOUND_REMOVALS;
                    doc.totalShares = 0;
                    acc.push(doc);
                    acc.push(amends);
                }
                return acc;
            }, []);
        }


        // split holdingchanges into removeAllocation, and 2 transfers
        /*function holdingChangeToTransfers(docs){
            const holdingChangeTypes = [Transaction.types.HOLDING_CHANGE];
            return  _.reduce(docs, (acc, doc, i) => {
                const holdingChangeActions = _.filter(doc.actions, a => holdingChangeTypes.indexOf(a.transactionMethod || a.transactionType) >= 0);
                if(!holdingChangeActions.length){
                    acc.push(doc);
                }
                else{
                    const transfers = _.cloneDeep(doc);
                    const removals = _.cloneDeep(doc);
                    const creations = _.cloneDeep(doc);
                    const results = holdingChangeActions.reduce((acc, a) => {
                        acc.transfers.push({
                            effectiveDate: a.effectiveDate,
                            beforeHolders: a.beforeHolders,
                            afterHolders: a.beforeHolders,
                            afterAmount: 0,
                            amount: a.amount,
                            beforeAmount: a.amount,
                            transactionType: Transaction.types.TRANSFER_FROM,
                            transactionMethod: Transaction.types.AMEND
                        });
                        acc.transfers.push({
                            effectiveDate: a.effectiveDate,
                            beforeHolders: a.afterHolders,
                            afterHolders: a.afterHolders,
                            afterAmount: a.amount,
                            amount: a.amount,
                            beforeAmount: 0,
                            transactionType: Transaction.types.TRANSFER_TO,
                            transactionMethod: Transaction.types.AMEND
                        });

                        acc.removals.push({
                            effectiveDate: a.effectiveDate,
                            holders: a.beforeHolders,
                            afterAmount: a.amount,
                            amount: a.amount,
                            matchHoldingId: {holders: a.afterHolders},
                            transactionType: Transaction.types.REMOVE_ALLOCATION
                        });

                        acc.creations.push({
                            effectiveDate: a.effectiveDate,
                            holders: a.afterHolders,
                            amount: 0,
                            transactionType: Transaction.types.NEW_ALLOCATION
                        });

                        return acc;
                    }, {transfers: [], removals: [], creations: []});

                    removals.actions = results.removals;
                    removals.transactionType = Transaction.types.INFERRED_INTRA_ALLOCATION_TRANSFER;
                    acc.push(removals);

                    transfers.actions = results.transfers;
                    transfers.transactionType = Transaction.types.INFERRED_INTRA_ALLOCATION_TRANSFER;
                    acc.push(transfers);

                    creations.actions = results.creations;
                    creations.transactionType = Transaction.types.INFERRED_INTRA_ALLOCATION_TRANSFER;
                    acc.push(creations);

                    docs.actions = doc.actions.filter(a => holdingChangeTypes.indexOf(a.transactionMethod || a.transactionType) < 0);
                    acc.push(doc)
                }
                return acc;
            }, [])
        }
        */
        let results = splitAmends(docs)
        //results = holdingChangeToTransfers(results);
        return results;
    },

    inferDirectorshipActions: function (data, docs){
        // The appointment and removal of directorships, inferred from start/end dates
        const doesNotContain = (docs, action) => {
            // make sure we haven't described this action yet
            return !_.some(docs, doc => {
                return _.find(doc.actions, a => {
                    return a.transactionType === action.transactionType && a.date === action.date && a.name === action.name;
                })
            });
        }

        const firstDetails = (fullName, address) => {
            // If the director changed name/address, then use that
            docs.map(doc => {
                (doc.actions || []).map((action) => {
                    if(action.transactionType === Transaction.types.UPDATE_DIRECTOR && action.afterName === fullName){
                        fullName = action.beforeName;
                        address = action.beforeAddress;
                    }
                })
            })
            return {
                name: fullName,
                address: address
            }

        }
        const results = [];

        data.directors.forEach(d => {
            const date = moment(d.appointmentDate, 'DD MMM YYYY').toDate();

            const action = {
                    transactionType: Transaction.types.NEW_DIRECTOR,
                    effectiveDate: date,
                    ...firstDetails(d.fullName, d.residentialAddress)
                };
            if(doesNotContain(docs, action) && doesNotContain(results, action)){
                results.push({
                    actions: [action],
                    // maybe infered transaction type
                    effectiveDate: date,
                });
            }
        });
        data.formerDirectors.forEach(d => {
            // without a cease date, this makes no sense
            // https://www.business.govt.nz/companies/app/ui/pages/companies/135116/directors
            const appointmentDate = moment(d.appointmentDate, 'DD MMM YYYY').toDate(),
                ceasedDate = moment(d.ceasedDate, 'DD MMM YYYY').toDate();
            let action = {
                    transactionType: Transaction.types.NEW_DIRECTOR,
                    name: d.fullName,
                    address: d.residentialAddress,
                    effectiveDate: appointmentDate
                };

            if(doesNotContain(docs, action) && doesNotContain(results, action)){
                results.push({
                    actions: [action],
                    effectiveDate: appointmentDate,
                    transactionType: Transaction.types.INFERRED_NEW_DIRECTOR
                });
            }
            action = {
                transactionType: Transaction.types.REMOVE_DIRECTOR,
                name: d.fullName,
                address: d.residentialAddress,
                effectiveDate: ceasedDate
            };


            if(doesNotContain(docs, action) && doesNotContain(results, action)){
                results.push({
                    actions: [action],
                    effectiveDate: ceasedDate,
                    transactionType: Transaction.types.INFERRED_REMOVE_DIRECTOR
                });
            }
        });
        return results;
    },

   inferNameChanges: function(data, docs){
        const results = [];
        const doesNotContain = (action) => {
            // make sure we haven't described this action yet
            return !_.some(docs, doc => {
                return _.find(doc.actions, a => {
                    return a.transactionType === action.transactionType &&
                        a.previousCompanyName === action.previousCompanyName &&
                        a.newCompanyName === action.newCompanyName &&
                        Math.abs(moment(a.effectiveDate).diff(moment(action.effectiveDate), 'days')) < 7;
                })
            });
        }
        data.previousNames.slice(0, data.previousNames.length-1).map((prevName, i) => {
            const action = {
                transactionType: Transaction.types.NAME_CHANGE,
                effectiveDate: moment(prevName.endDate, 'DD MMM YYYY').toDate(),
                previousCompanyName: prevName.name,
                newCompanyName: i ? data.previousNames[i-1].name : data.companyName,
            }
            if(doesNotContain(action)){
                results.push({
                    actions: [action],
                    effectiveDate: action.effectiveDate,
                    transactionType: Transaction.types.NAME_CHANGE,
                });
            }
        });
        return results;
    },

    extraActions: function(data, docs){
        // This are INFERED actions
        let results = InferenceService.inferDirectorshipActions(data, docs);
        results = results.concat(InferenceService.inferNameChanges(data, docs));
        return results;
    },


    segmentAndSortActions: function(docs){
        // split group actions by date
        const TRANSACTION_ORDER = {
            [Transaction.types.INFERRED_REMOVE_DIRECTOR]: 1,
            [Transaction.types.INFERRED_NEW_DIRECTOR]: 0
        }
        docs = docs.reduce((acc, doc) =>{
            const docDate = doc.date;
            const groups = _.groupBy(doc.actions, action => action.effectiveDate);

            const copyDoc = (doc) => {
                return _.omit(doc, 'actions');
            }

            const setDate = (doc) => {
                doc.effectiveDate = _.min(doc.actions || [], (a) => a.effectiveDate ? a.effectiveDate : docDate).effectiveDate || docDate;
                return doc;
            }

            if(Object.keys(groups).length > 1){
                Object.keys(groups).map(k => {
                    const newDoc = copyDoc(doc);
                    newDoc.actions = groups[k];
                    acc.push(setDate(newDoc));
                });
            }
            else{
                acc.push(setDate(doc));
            }
            return acc;
        }, []);
        docs = _.sortByAll(docs,
                           'effectiveDate',
                           (d) => parseInt(d.documentId, 10),
                           (d) => d.actions && d.actions.length && TRANSACTION_ORDER[d.transactionType]
                           ).reverse();

        // AFTER SORT
        docs = InferenceService.inferAmendTypes(docs);
        docs = InferenceService.insertIntermediateActions(docs);
        docs.map(p => {
            p.id = uuid.v4();
            (p.actions || []).map(a => a.id = uuid.v4())
        })

        return docs;
    },

}

