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
                const allocationsUp = _.filter(d.actions, a => a.amount && a.afterAmount > a.beforeAmount).length;
                const allocationsDown = _.filter(d.actions, a => a.amount && a.afterAmount < a.beforeAmount).length;

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
                    acc.push(d);
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
                    });
                    acc.push(d);
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
                                            a.transactionType = Transaction.types.CONSOLIDATION_FROM;
                                            break;
                                        case Transaction.types.REDEMPTION:
                                            a.transactionType = Transaction.types.REDEMPTION_FROM;
                                            break;
                                    }
                                });
                            }
                        }
                    });
                    acc.push(d);
                }
                else{
                    acc.push(d);
                }
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
                            ...a,
                            effectiveDate: a.effectiveDate,
                            beforeHolders: a.holders,
                            afterHolders: a.holders,
                            afterAmount: 0,
                            amount: a.amount,
                            beforeAmount: a.amount,
                            transactionMethod: Transaction.types.AMEND,
                            transactionType: [Transaction.types.AMEND,
                                Transaction.types.NEW_ALLOCATION,
                                Transaction.types.REMOVE_ALLOCATION].indexOf(a.transactionType) < 0 ? a.transactionType : Transaction.types.AMEND
                        }
                    })
                    doc.actions = doc.actions.filter(a => {
                        if(removalTypes.indexOf(a.transactionMethod || a.transactionType) >= 0){
                            a.transactionType = Transaction.types.REMOVE_ALLOCATION;
                            a.transactionMethod = null;
                            a.amount = 0;
                            a.beforeAmount = 0;
                            a.afterAmount = 0;
                            a.beforeAmountLookup = null;
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


        function splitMultiTransfers(docs){
            // segment out transfers into separate pairwise transactions
            const transferTypes = [Transaction.types.TRANSFER_TO, Transaction.types.TRANSFER_FROM];
            return  _.reduce(docs, (acc, doc, i) => {
                const transferActions = _.filter(doc.actions, a => transferTypes.indexOf(a.transactionType) >= 0);
                //const holdingChange = _.filter(doc.actions, a => a.unknownHoldingChange)
                if(!transferActions.length || transferActions.length === 2){
                    // if no transfers, or already a pair, then continue
                    acc.push(doc);
                }
                /*else if(holdingChange.length){
                    // don't know in what order to do pairing
                    holdingChange.map(a => a.requiresTransferOrdering = true);
                    acc.push(doc);
                }*/
                else{
                    let up = doc.actions.filter(a => a.afterAmount > a.beforeAmount);
                    let down = doc.actions.filter(a => a.afterAmount < a.beforeAmount);
                    if(up.length === 1){
                        // to make it this far, you must have 1 down, >=1 up, or vice versa.
                        up = _.cloneDeep(up[0]);
                        down.map(action => {
                            const docClone = _.cloneDeep(doc);
                            up.amount = action.amount;
                            up.beforeAmount = up.afterAmount - action.amount;
                            if(up.beforeAmount !== 0 && up.transactionMethod === Transaction.types.NEW_ALLOCATION){
                                up.transactionMethod = Transaction.types.AMEND;
                                up.afterHolders = up.holders;
                                up.beforeHolders = up.holders;
                            }
                            else if(up.beforeAmount === 0){
                                up.transactionMethod = Transaction.types.NEW_ALLOCATION;
                            }
                            docClone.actions = [
                                _.cloneDeep(up),
                                action
                            ];
                            docClone.totalShares = 0;
                            acc.push(docClone);
                            up.afterAmount = up.beforeAmount;
                        });
                    }
                    else{
                        down = _.cloneDeep(down[0]);
                        up.map(action => {
                            const docClone = _.cloneDeep(doc);
                            down.amount = action.amount;
                            down.beforeAmount = down.afterAmount + action.amount;
                            docClone.actions = [
                                _.cloneDeep(down),
                                action
                            ];
                            docClone.totalShares = 0;
                            acc.push(docClone);
                            down.afterAmount = down.beforeAmount;
                        });
                    }
                }
                return acc;
            }, []);
        }

        let results = splitAmends(docs);


        //results = splitMultiTransfers(results);

        return results;
    },

    splitHoldingTransfers: function(docs) {
        // holding transfers are now deprecated
        return docs.reduce((acc, doc) => {
            const standardActions = [];
            const removals = []
            doc.actions = (doc.actions || []).reduce((acc, action) => {
                if(action.transactionType === Transaction.types.HOLDING_TRANSFER){
                    const amend = {
                        ...action,
                        unknownAmount: null,
                        afterHolders: null,
                        beforeHolders: null,
                        amount: action.beforeAmount,
                        afterAmount: 0,
                        transactionType: Transaction.types.REMOVE_ALLOCATION,
                        holders: action.beforeHolders,
                    };
                    if(action.unknownAmount){
                        amend.transactionMethod = Transaction.types.REMOVE_ALLOCATION;
                        amend.transactionType = Transaction.types.TRANSFER_FROM;
                        amend.unknownAmount = null;
                        amend.inferAmount = true;
                        amend.beforeAmountLookup = {afterHolders: action.afterHolders};
                    }


                    const newAlloc = {
                        ...action,
                        transactionType: Transaction.types.NEW_ALLOCATION,
                        amount: action.afterAmount,
                        afterAmount: action.afterAmount,
                        beforeAmount: 0,
                        holders: action.afterHolders,
                        beforeHolders: null,
                        afterHolders: null
                    }

                    if(action.unknownAmount){
                        newAlloc.transactionMethod = Transaction.types.NEW_ALLOCATION;
                        newAlloc.transactionType = Transaction.types.TRANSFER_TO;
                        newAlloc.unknownAmount = null;
                        newAlloc.inferAmount = true
                        newAlloc.afterAmountLookup = {beforeHolders: action.beforeHolders};
                    }

                    acc.push(newAlloc);
                    acc.push(amend);

                }
                else{
                    acc.push(action);
                }
                return acc;
            }, []);
            acc.push(doc);
            return acc;
        }, []);
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
                    effectiveDate: appointmentDate,
                    orderingCoef: 0
                };

            if(doesNotContain(docs, action) && doesNotContain(results, action)){
                results.push({
                    actions: [action],
                    effectiveDate: appointmentDate,
                    transactionType: Transaction.types.INFERRED_NEW_DIRECTOR,
                    orderingCoef: 0
                });
            }
            action = {
                transactionType: Transaction.types.REMOVE_DIRECTOR,
                name: d.fullName,
                address: d.residentialAddress,
                effectiveDate: ceasedDate,
                orderingCoef: 1
            };


            if(doesNotContain(docs, action) && doesNotContain(results, action)){
                results.push({
                    actions: [action],
                    effectiveDate: ceasedDate,
                    transactionType: Transaction.types.INFERRED_REMOVE_DIRECTOR,
                    orderingCoef: 1
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

    massageAmendAllocations: function(docs){
        // if a 'Amended Shareholder' happens just before a 'Amended Share Allocation',
        // then the name needs to be set to the old version
        // See Judith Elisabeth HERBERT in
        // http://www.business.govt.nz/companies/app/ui/pages/companies/1951111/21005885/entityFilingRequirement

        return docs.reduce((acc, doc) => {
            const holderChanges = []
            const standardActions = (doc.actions || []).reduce((acc, action) => {
                if(action.transactionType === Transaction.types.HOLDER_CHANGE){
                    const changedPerson = Person.build(action.afterHolder);
                    const beforeHolder = action.beforeHolder;
                    doc.actions.map(otherAction => {
                        if(otherAction.afterHolders){
                            otherAction.afterHolders.map((afterHolder, i) => {
                                if(changedPerson.isEqual(afterHolder)){
                                    otherAction.afterHolders[i] = beforeHolder;
                                }
                            })
                        }
                    });
                    holderChanges.push(action);
                }
                else{
                    acc.push(action)
                }
                return acc;
            }, []);
            if(holderChanges.length){
                acc.push({
                    ...doc,
                    transactionType: Transaction.types.HOLDER_CHANGE,
                    actions: holderChanges
                })
            }
            acc.push({
                ...doc,
                actions: standardActions
            });
            return acc;
        }, []);
    },

    extraActions: function(data, docs){
        // These are INFERED actions
        let results = InferenceService.inferDirectorshipActions(data, docs);
        results = results.concat(InferenceService.inferNameChanges(data, docs));
        return results;
    },


    segmentAndSortActions: function(docs){
        // split group actions by date

        const TRANSACTION_ORDER = {
            [Transaction.types.INFERRED_REMOVE_DIRECTOR]: 1,
            [Transaction.types.INFERRED_NEW_DIRECTOR]: 2,
            [Transaction.types.HOLDER_CHANGE] : 3,
            undefined: 2
        }

        docs = InferenceService.massageAmendAllocations(docs)

        docs =  InferenceService.splitHoldingTransfers(docs);

        // before sort, fine amend types
        docs = InferenceService.inferAmendTypes(docs);



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
                           'orderingCoef',
                           (d) => parseInt(d.documentId, 10),
                           (d) => d.actions && d.actions.length && TRANSACTION_ORDER[d.transactionType]
                           ).reverse();

        // AFTER SORT
        docs = InferenceService.insertIntermediateActions(docs);
        // Add ids
        docs.map(p => {
            p.id = uuid.v4();
            (p.actions || []).map(a => a.id = uuid.v4())
        })

        return docs;
    },

}

