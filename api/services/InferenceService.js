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
                    const MAX_DISTANCE = 12;
                    for(let i = 1; i < MAX_DISTANCE; i++){
                        const max = Math.min(Math.max(0, index+i), actionSets.length-1);
                        const min = Math.min(Math.max(0, index-i), actionSets.length-1);
                        if(actionSets[max].totalShares === matchValue){
                            return actionSets[max];
                        }
                        if(actionSets[min].totalShares === matchValue){
                            return actionSets[min];
                        }
                    }
                    return null;
                }

                const allocationsUp = _.filter(d.actions, a => a.amount && a.afterAmount > a.beforeAmount).length;
                const allocationsDown = _.filter(d.actions, a => a.amount && a.afterAmount < a.beforeAmount).length;

                // not so simple as sums, see http://www.business.govt.nz/companies/app/ui/pages/companies/2109736/19916274/entityFilingRequirement
                if(d.totalShares === 0 && (allocationsUp === 1 || allocationsDown === 1)){
                    // totalShares = zero SHOULD mean transfers.

                    d.actions.map(a => {
                        a.transactionMethod = a.transactionType;
                        if(a.transactionType === Transaction.types.NEW_ALLOCATION){
                            a.inferredType = true;
                            a.transactionType = Transaction.types.TRANSFER_TO;
                        }
                        if(a.transactionType === Transaction.types.REMOVE_ALLOCATION){
                            a.inferredType = true;
                            a.transactionType = Transaction.types.TRANSFER_FROM;
                        }
                        else if(a.transactionType === Transaction.types.AMEND){
                            a.inferredType = true;
                            a.transactionType  = a.afterAmount > a.beforeAmount ? Transaction.types.TRANSFER_TO : Transaction.types.TRANSFER_FROM;
                        }
                    })
                    acc.push(d);
                }

                // if we find a match, then move all the transactions into that
                else if(d.totalShares > 0 && allocationsDown === 0){
                    const match = getMatchingDocument(i, -d.totalShares);
                    if(match){
                        const newActions = d.actions.filter((a, i) => {
                            if(a.transactionType === Transaction.types.NEW_ALLOCATION ||
                               a.transactionType === Transaction.types.AMEND){
                                a.transactionMethod = a.transactionType;
                                return match.actions.some(m => {
                                    switch(m.transactionType){
                                        case Transaction.types.ISSUE:
                                            a.transactionType = Transaction.types.ISSUE_TO;
                                            return true;
                                        case Transaction.types.CONVERSION:
                                            a.transactionType = Transaction.types.CONVERSION_TO;
                                            return true;
                                        case Transaction.types.SUBDIVISION:
                                            a.transactionType = Transaction.types.SUBDIVISION_TO;
                                            return true;
                                    }
                                });
                            }
                        });
                        d.actions = d.actions.filter(a => newActions.indexOf(a) === -1)
                        if(newActions.length){
                            newActions.map(a => {
                                a.inferredType = true;
                                a.effectiveDate = match.actions[0].effectiveDate || match.effectiveDate;
                            });

                            match.actions = match.actions.concat(newActions);
                            match.totalShares = 0;
                        }
                    }
                    acc.push(d);
                }

                else if(d.totalShares < 0 && allocationsUp === 0){
                    const match = getMatchingDocument(i, -d.totalShares);
                    if(match){
                        const newActions = d.actions.filter((a, i) => {
                            if(a.transactionType === Transaction.types.AMEND || a.transactionType === Transaction.types.REMOVE_ALLOCATION){
                                a.transactionMethod = a.transactionType;
                                return match.actions.some(m => {
                                    switch(m.transactionType){
                                        case Transaction.types.PURCHASE:
                                            a.transactionType = Transaction.types.PURCHASE_FROM;
                                            return true;
                                        case Transaction.types.ACQUISITION:
                                            a.transactionType = Transaction.types.ACQUISITION_FROM;
                                            return true;
                                        case Transaction.types.CONSOLIDATION:
                                            a.transactionType = Transaction.types.CONSOLIDATION_FROM;
                                            return true;
                                        case Transaction.types.REDEMPTION:
                                            a.transactionType = Transaction.types.REDEMPTION_FROM;
                                            return true;
                                    }
                                });
                            }
                        });
                        d.actions = d.actions.filter(a => newActions.indexOf(a) === -1)
                        if(newActions.length){
                            newActions.map(a => {
                                a.inferredType = true;
                                 a.effectiveDate = match.actions[0].effectiveDate || match.effectiveDate;
                            });
                            match.actions = match.actions.concat(newActions);
                            match.totalShares = 0;
                        }
                    }
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

    flagTreasuryTransactions: function(actionSets, companyNumber) {
        actionSets.map(actionSet => {
            (actionSet.actions || []).map(action => {
                const holders = action.holders || action.afterHolders;
                // if a holder is the company, then transfers are actually acquisitions/reissues
                if(holders && holders.find(h => companyNumber && h.companyNumber === companyNumber)){

                    if(action.transactionType === Transaction.types.TRANSFER_TO){
                        action.transactionType = Transaction.types.TRANSFER_TO_ACQUISITION;
                        // find and modify inverse actions
                        actionSet.actions.map(otherActions => {
                            if(otherActions.transactionType === Transaction.types.TRANSFER_FROM){
                                action.transactionType = Transaction.types.TRANSFER_FROM_ACQUISITION;
                            }
                        })
                    }

                    if(action.transactionType === Transaction.types.TRANSFER_FROM){
                        action.transactionType = Transaction.types.TRANSFER_FROM_RESISSUE;
                         // find and modify inverse actions
                        actionSet.actions.map(otherActions => {
                            if(otherActions.transactionType === Transaction.types.TRANSFER_TO){
                                action.transactionType = Transaction.types.TRANSFER_TO_RESISSUE;
                            }
                        })
                    }
                }
            })
        })
        return actionSets;
    },


     insertIntermediateActions: function (docs){
        //  split removeAllocations into amend to zero, then removeAllocation.
        function splitAmends(docs){
            const removalTypes = [Transaction.types.REMOVE_ALLOCATION];
            docs.map((doc, i) => {
                if(doc.actions){
                    doc.actions = doc.actions.map(a => {
                        if(removalTypes.indexOf(a.transactionMethod || a.transactionType) >= 0){
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
                        }
                        return a;
                     });
                }
            });
            return docs;
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
                    acc.push(amend);
                    acc.push(newAlloc);

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
                    return a.transactionType === action.transactionType &&
                    moment(a.date || a.effectiveDate || doc.date).isSame(action.effectiveDate, 'day') &&
                    a.name === action.name;
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



        const incorporationDoc = docs.find(d => d.transactionType === Transaction.types.INCORPORATION);

        const incorporationDate = incorporationDoc ? moment(incorporationDoc.date || incorporationDoc.effectiveDate) :
            moment(data.incorporationDate, 'DD MMM YYYY');

        incorporationDate.add(1, 'second');

        data.directors.forEach(d => {
            const date = moment(d.appointmentDate, 'DD MMM YYYY')

            const action = {
                    transactionType: Transaction.types.NEW_DIRECTOR,
                    effectiveDate: moment.max(date, incorporationDate).toDate(),
                    ...firstDetails(d.fullName, d.residentialAddress)
                };
            if(doesNotContain(docs, action) && doesNotContain(results, action)){
                results.push({
                    actions: [action],
                    // maybe infered transaction type,
                    transactionType: Transaction.types.INFERRED_NEW_DIRECTOR,
                    effectiveDate: moment.max(date, incorporationDate).toDate()
                });
            }
        });


        data.formerDirectors.forEach(d => {
            // without a cease date, this makes no sense
            // https://www.business.govt.nz/companies/app/ui/pages/companies/135116/directors
            const appointmentDate = moment(d.appointmentDate, 'DD MMM YYYY'),
                ceasedDate = moment(d.ceasedDate, 'DD MMM YYYY');

            let action = {
                    transactionType: Transaction.types.NEW_DIRECTOR,
                    name: d.fullName,
                    address: d.residentialAddress,
                    effectiveDate: moment.max(appointmentDate, incorporationDate).toDate(),
                    orderingCoef: 0
                };

            if(doesNotContain(docs, action) && doesNotContain(results, action)){
                results.push({
                    actions: [action],
                    effectiveDate:  moment.max(appointmentDate, incorporationDate).toDate(),
                    transactionType: Transaction.types.INFERRED_NEW_DIRECTOR,
                    orderingCoef: 0
                });
            }
            action = {
                transactionType: Transaction.types.REMOVE_DIRECTOR,
                name: d.fullName,
                address: d.residentialAddress,
                effectiveDate:  moment.max(ceasedDate, incorporationDate).toDate(),
                orderingCoef: 1
            };


            if(doesNotContain(docs, action) && doesNotContain(results, action)){
                results.push({
                    actions: [action],
                    effectiveDate:  moment.max(ceasedDate, incorporationDate).toDate(),
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
                        // magic number for noise around date change, 7 days
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
    inferCompanyShareholderNameChanges: function(data, docs){
        // for now, check if we have ever had any shareholders that are companies, and then check if they ever have had name changes
        let companies = [];
        data.holdings.allocations.map(a => {
            a.holders.map(h => {
                if(h.companyNumber){
                    companies.push({name: h.name, companyNumber: h.companyNumber});
                }
            })
        })
        data.historicHolders.map(h => {
            // is historic holder name all in capitals?  probably a company
            if(h.name.toLocaleUpperCase() === h.name){
                companies.push({name: h.name, date: moment(h.vacationDate, 'DD MMM YYYY').toDate()});
            }
        });
        return CompanyInfoService.getNameChangeActions(companies, data);
    },
    massageAmendAllocations: function(docs){
        // if a 'Amended Shareholder' happens just before a 'Amended Share Allocation',
        // then the name needs to be set to the old version
        // See Judith Elisabeth HERBERT in
        // http://www.business.govt.nz/companies/app/ui/pages/companies/1951111/21005885/entityFilingRequirement

        return docs.reduce((acc, doc) => {
            const holderChanges = [];
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
            if(standardActions.length){
                acc.push({
                    ...doc,
                    actions: standardActions
                });
            }
            return acc;
        }, []);
    },

    sharesToParcels: function(docs){

        return docs.map(d => {
            if(d.actions){
                return {...d, actions: d.actions.map(a => {
                    const {amount, beforeAmount, afterAmount, shareClass, ...rest} = a;
                    if(amount !== undefined || a.unknownAmount){
                        return {...rest, parcels: [{amount, beforeAmount, afterAmount, shareClass}]};
                    }
                    return a;
                })}
            }
            return d;
        });
    },

    extraActions: function(data, docs){
        // These are INFERED actions
        docs = docs.concat(InferenceService.inferDirectorshipActions(data, docs));
        docs = docs.concat(InferenceService.inferNameChanges(data, docs));
        return InferenceService.inferCompanyShareholderNameChanges(data, docs)
            .then(nameChanges => {
                return docs.concat(nameChanges)
            });
    },

    userSkipOldDocs: function(docs){
        const CUT_OFF_TIME = 10;
        const startDate = moment(docs[0].effectiveDate);
        docs.map(d => {
            if(startDate.diff(moment(d.effectiveDate), 'years', true) > CUT_OFF_TIME){
                d.actions.map(a =>{
                    a.userSkip = true;
                    a.userConfirmed = true;
                });
                d.historic = true;
            }
        })
        return docs;
    },

    segmentAndSortActions: function(docs, companyNumber){
        // split group actions by date

        const TRANSACTION_ORDER = {
            [Transaction.types.INFERRED_REMOVE_DIRECTOR]: 1,
            [Transaction.types.INFERRED_NEW_DIRECTOR]: 2,
            [Transaction.types.HOLDER_CHANGE] : 3,

            [Transaction.types.REMOVE_DIRECTOR] : 1,
            [Transaction.types.NEW_DIRECTOR] : 2,
            [Transaction.types.INCORPORATION] : 0,
            [Transaction.types.AMEND] : 4,
            undefined: 2
        }

        docs = InferenceService.massageAmendAllocations(docs)

        docs =  InferenceService.splitHoldingTransfers(docs);

        // before sort, fine amend types
        docs = InferenceService.inferAmendTypes(docs);
        docs = InferenceService.flagTreasuryTransactions(docs, companyNumber);



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
                           (d) => (d.actions && d.actions.length && TRANSACTION_ORDER[d.transactionMethod || d.transactionType]) || 0,
                           ).reverse();

        // AFTER SORT
        docs = InferenceService.insertIntermediateActions(docs);
        docs = InferenceService.sharesToParcels(docs);
        // filter out inert docs
        docs = docs.filter(d => d.actions && d.actions.some(a => a.transactionType));
        // Add ids

        docs.map((p, i) => {
            p.id = uuid.v4();
            p.actions = (p.actions || []).filter(a => !!a.transactionType);
            (p.actions || []).map(a => a.id = uuid.v4());
            p.orderFromSource = i;
        });
        docs = docs.filter(d => d.actions.length);

        docs = InferenceService.userSkipOldDocs(docs);
        return docs;
    },

}

