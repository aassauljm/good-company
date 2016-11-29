/**
 * CompanyStateController
 *
 * @description :: Server-side logic for managing CompanyStates
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var Promise = require('bluebird');
var _ = require('lodash');
var actionUtil = require('sails-hook-sequelize-blueprints/actionUtil');
var fs = Promise.promisifyAll(require("fs"));
const uuid = require('node-uuid')
const moment = require('moment');


function validateHoldings(newHoldings){
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
            if(parcel.amount < 1){
                throw new sails.config.exceptions.ValidationException('Parcels amounts must be positve');
            }
        });
    });
}


function transactionMessages(transactions, companyName){
    const results = [];

    const calcSum = (transactions, type) => transactions.reduce((acc, t) => {
        return acc + _.sum((t.actions || []).filter(t => t.transactionType === type), 'amount')
    }, 0);

    const issue = _.filter(transactions, t => t.transactionType === Transaction.types.ISSUE);
    const conversion = _.filter(transactions, t => t.transactionType === Transaction.types.CONVERSION);
    const purchase = _.filter(transactions, t => t.transactionType === Transaction.types.PURCHASE);
    const acquisition = _.filter(transactions, t => t.transactionType === Transaction.types.ACQUISITION);
    const consolidation = _.filter(transactions, t => t.transactionType === Transaction.types.CONSOLIDATION);
    const subdivision = _.filter(transactions, t => t.transactionType === Transaction.types.SUBDIVISION);
    const redemption = _.filter(transactions, t => t.transactionType === Transaction.types.REDEMPTION);
    const transfer = _.filter(transactions, t => t.transactionType === Transaction.types.TRANSFER);
    const details = _.filter(transactions, t => t.transactionType === Transaction.types.DETAILS);
    const holdings = _.filter(transactions, t => t.transactionType === Transaction.types.HOLDING_CHANGE);
    const holders = _.filter(transactions, t => t.transactionType === Transaction.types.HOLDER_CHANGE);
    //const newAllocation = _.filter(transactions, t => t.transactionType === Transaction.types.NEW_ALLOCATION);
    const addDirector = _.filter(transactions, t => t.transactionType === Transaction.types.NEW_DIRECTOR);
    const removeDirector = _.filter(transactions, t => t.transactionType === Transaction.types.REMOVE_DIRECTOR);
    const updateDirector = _.filter(transactions, t => t.transactionType === Transaction.types.UPDATE_DIRECTOR);


    if(issue.length){
        const sum = calcSum(issue, Transaction.types.ISSUE);
        const plural = sum !== 1 ? 'shares' : 'share';
        results.push({message: `${sum} ${plural} issued for ${companyName}`})
    }
    if(conversion.length){
        const sum = calcSum(conversion, Transaction.types.CONVERSION);
        const plural = sum !== 1 ? 'shares' : 'share';
        results.push({message: `${sum} ${plural} converted for ${companyName}`})
    }
    if(purchase.length){
        const sum = calcSum(purchase, Transaction.types.PURCHASE);
        const plural = sum !== 1 ? 'shares' : 'share';
        results.push({message: `${sum} ${plural} purchased for ${companyName}`})
    }
    if(acquisition.length){
        const sum = calcSum(acquisition, Transaction.types.ACQUISITION);
        const plural = sum !== 1 ? 'shares' : 'share';
        results.push({message: `${sum} ${plural} purchased for ${companyName}`})
    }
    if(consolidation.length){
        const sum = calcSum(acquisition, Transaction.types.CONSOLIDATION);
        const plural = sum !== 1 ? 'shares' : 'share';
        results.push({message: `${sum} ${plural} consolidated for ${companyName}`})
    }
    if(subdivision.length){
        const sum = calcSum(subdivided, Transaction.types.SUBDIVISION);
        const plural = sum !== 1 ? 'shares' : 'share';
        results.push({message: `${sum} ${plural} subdivided for ${companyName}`})
    }
    if(transfer.length){
        const sum = calcSum(transfer, Transaction.types.TRANSFER_FROM);
        const plural = sum !== 1 ? 'shares' : 'share';
        results.push({message: `${sum} ${plural} transfered for ${companyName}`})
    }
    if(details.length){
        results.push({message: `Details updated for ${companyName}`})
    }
    if(holdings.length){
        results.push({message: `Shareholding updated for ${companyName}`})
    }
    if(holders.length){
        results.push({message: `Shareholder updated for ${companyName}`})
    }
    if(addDirector.length){
        results.push({message: `Director added for ${companyName}`})
    }
    if(removeDirector.length){
        results.push({message: `Director removed for ${companyName}`})
    }
    if(updateDirector.length){
        results.push({message: `Director updated for ${companyName}`})
    }
    return results;

}

function createActivityLog(user, company, messages){
    if(!Array.isArray(messages)){
        messages = [messages];
    }
    messages = messages.filter(m => m);
    return ActivityLog.bulkCreate(messages.map(m => {
        return {
            userId: user.id,
            companyId: company.id,
            description: m.message,
            data: {companyId: company.id}
        }
    }));
}

// TODO, move to transaction service
var transactions = {
    seed: function(args, company) {
        return TransactionService.performSeed(args, company,  new Date())
            .then(function(){
                return {message: `Company seeded`}
            })
    },
    issue: function(args, company){
        const classes = {};
        ((args.holdingList || {}).holdings || []).map((h) => {
            (h.parcels || []).map(p => {
                classes[p.shareClass] = (classes[p.shareClass] || 0) + p.amount;
            });
        });
        const sets = [];
        Object.keys(classes)
            .map(c => {
                // ugly, think of better way to have empty key turned into undefined
                const cInt =  c !== 'undefined' ? parseInt(c, 10) : undefined;
                const actions = [];
                const date = args.effectiveDate || new Date();
                actions.push({
                    amount: classes[c],
                    shareClass: cInt,
                    effectiveDate: date,
                    transactionType: Transaction.types.ISSUE
                });
                ((args.holdingList || {}).holdings || []).map((h) => {
                    h.parcels.filter(p => p.shareClass === cInt).map(p => {
                        actions.push({
                            transactionType: Transaction.types.ISSUE_TO,
                            transactionMethod: Transaction.types.AMEND,
                            holders: h.holders,
                            shareClass: cInt,
                            amount: p.amount,
                            effectiveDate: date,
                            beforeAmount: p.beforeAmount,
                            afterAmount: p.afterAmount
                        })
                    })
                })
                sets.push({
                    effectiveDate: date,
                    actions: actions
                });
            });

        if(!sets.length){
            throw new sails.config.exceptions.ValidationException('Parcels are required')
        }
        return TransactionService.performAllInsertByEffectiveDate(sets, company)
        .then(() => {
            return {message: `Shares issued`}
        })
    },


    details: function(args, company){
        let name;
        /// MNO!!!!! find now and replay
        return company.getCurrentCompanyState()
        .then(function(currentCompanyState){
            const date = new Date();
            return currentCompanyState.buildNext(_.merge({}, args, {
                transaction: {type: Transaction.types.DETAILS, data: args, effectiveDate: args.effectiveDate || date }
            }))
        })
        .then(function(nextCompanyState){
            name = nextCompanyState.companyName;
            return nextCompanyState.save();
        })
        .then(function(nextCompanyState){
            return company.setCurrentCompanyState(nextCompanyState);
        })
        .then(function(){
            return company.save();
        })
        .then(function(){
            return {message: `Details updated for ${name}.`}
        })
    },

    compound: function(args, company){
        // TODO, validate different pairings
        let state, date = args.transactions[0].effectiveDate;
        date = date || args.transactions[0].actions[0].effectiveDate || new Date();
        args.transactions.map(t => {
            t.effectiveDate = t.effectiveDate || date;
        });
        // TODO directorUpdate and holderchange should generate in same set
        if(args.documents){
            args.transactions.map(t => t.documents = args.documents);
        }
        return TransactionService.performAllInsertByEffectiveDate(args.transactions, company)
            .then((_state) => {
                state = _state;
                if(args.documents){
                    return Promise.all(args.documents.map(d => d.update({date: date})));
                }
            })
            .then(() => {
                return transactionMessages(args.transactions, state.companyName);
            })
    },

    createRegisterEntry: function (data, company){
        let companyState, register;
        return company.getCurrentCompanyState()
            .then(function(currentCompanyState){
                return currentCompanyState.buildNext({
                    transaction: {type: Transaction.types.REGISTER_ENTRY, data: _.omit(data, 'documents'), effectiveDate: new Date() }
                });
            })
            .then(function(cs){
                companyState = cs;
                return companyState.getIRegister();
            })
            .then(function(register){
                if(!register){
                    return InterestsRegister.build();
                }
                return register.buildNext();
            })
            .then(function(register){
                return register.save();
            })
            .then(function(r){
                register = r;
                return InterestsEntry.create(data, {include: [{model: Document, as: 'documents', include: [
                                                {model: DocumentData, as: 'documentData'}
                                            ]}]})
            })
            .then(function(entry){
                return entry.setPersons(data.persons)
                    .then(() => entry)
            })
            .then(function(entry){
                return register.addEntry(entry)
            })
            .then(function(){
                companyState.set('register_id', register.id);
                return companyState.save();
            })
            .then(function(nextCompanyState){
                return company.setCurrentCompanyState(companyState);
             })
            .then(function(){
                return company.save();
            })
            .then(function(){
                return {message: `Entry created for ${companyState.companyName} Interest Register.`}
            })
    },

    createShareClass: function(data, company){
        let companyState, shareClasses;
        let effectiveDate = new Date();
        const actions = [{..._.omit(data, 'documents'), id: uuid.v4(), transactionType: Transaction.types.CREATE_SHARE_CLASS}]
        return company.getCurrentCompanyState()
        .then(function(currentCompanyState){
            return currentCompanyState.buildNext({
                transaction: {type: Transaction.types.CREATE_SHARE_CLASS, data: actions[0], effectiveDate: effectiveDate }
            });
        })
        .then(function(cs){
            companyState = cs;
            return companyState.getShareClasses({
                    include: [{
                        model: ShareClass,
                        as: 'shareClasses'
                    }]
                });
        })
        .then(function(shareClasses){
            if(!shareClasses){
                return ShareClasses.build();
            }
            else{
                shareClasses.shareClasses.map(s => {
                    if(s.name === data.name){
                        throw new sails.config.exceptions.NameExistsException('Share Class name already exists.')
                    }
                })
            }
            return shareClasses.buildNext();
        })
        .then(function(shareClasses){
            return shareClasses.save();
        })
        .then(function(r){
            shareClasses = r;
            const attributes = {name: data.name, properties: _.omit(data, 'name', 'documents')}
            return ShareClass.create(attributes, {include: [{model: Document, as: 'documents'}]})
        })
        .then(function(shareClass){
            shareClass.validate();
            return shareClasses.addShareClass(shareClass)
        })
        .then(function(){
            if(data.documents){
                return TransactionService.addDocuments(companyState, data.documents)
            }
        })
        .then(function(){
            companyState.set('s_classes_id', shareClasses.id);
            return companyState.save();
        })
        .then(function(){
            return company.setCurrentCompanyState(companyState);
        })
        .then(() => {
            return TransactionService.addActions(companyState, {
                id:  uuid.v4(),
                actions: actions,
                effectiveDate: effectiveDate,
                transactionType: Transaction.types.CREATE_SHARE_CLASS
            },  company);
        })
        .then(() => {
            return companyState.save();
        })
        .then(function(){
            return {message: `Share Class created for ${companyState.companyName}`}
        })
    },

    updateShareClass: function(data, company){
        let companyState;
        return company.getCurrentCompanyState()
            .then(function(_companyState) {
                companyState = _companyState;
                return companyState.groupTotals();
            })
            .then(groupTotals => {
                if(groupTotals[data.shareClassId] && groupTotals[data.shareClassId].amount > 0){
                    throw new sails.config.exceptions.ValidationException('Cannot update share classes that are on issue');
                }
                return companyState.getShareClasses({
                            include: [{
                                model: ShareClass,
                                as: 'shareClasses',
                                where: {id: parseInt(data.shareClassId, 10) }
                            }],
                        })
            })
            .then(function(shareClasses) {
                if(shareClasses.dataValues.shareClasses.length !== 1){
                    throw new sails.config.exceptions.ValidationException('Share class not found');
                }
                return shareClasses.dataValues.shareClasses[0].update({name: data.name, properties: _.omit(data, 'name')});
            })
            .then(function(){
                return {message: `Share Class updated for ${companyState.companyName}`};
            })

    },

}

const selfManagedTransactions = {
    // ew snake case, gross
     apply_share_classes: function (data, company){
        /* to apply, retroactively, a share class:
            * clone current state without apply previousCompanyStateId.
            * set shareClass ids on parcels
            * import historic actions, until SEED
        */
        let state, companyName, historic_action_id, newRoot;
        return sequelize.transaction(function(t){
            return company.getCurrentCompanyState()
                .then(currentState => {
                    historic_action_id = currentState.get('historic_action_id');
                    return currentState.save();
                })
                .then(() => {
                    return TransactionService.performTransaction({
                            actions: data.actions,
                            effectiveDate: data.effectiveDate || new Date(),
                            transactionType: Transaction.types.APPLY_SHARE_CLASSES
                        }, company)
                })
                .then(_state => {
                    state = _state;
                    companyName = state.get('companyName')
                    return state.buildPrevious({
                        transaction: null,
                        transactionId: null,
                        previousCompanyStateId: null,
                        pending_historic_action_id: historic_action_id }, {newRecords: true});
                })
                .then(function(_newRoot){
                    newRoot = _newRoot
                    return newRoot.save();
                })
                .then(function(){
                    sails.log.info('History reset for companyState', state.id);
                    return state.setPreviousCompanyState(newRoot);
                })

                .then(state => {
                    return state.save();
                })
            })
            .then(state => {
                return TransactionService.performInverseAllPending(company, (action => action.data.transactionType === Transaction.types.SEED))
                .catch(e => {
                    // swallow import error
                })
            })
            .then(function() {
                return {
                    message: `Share Classes applied for ${companyName}`
                }
            });
    },

    createThenApplyShareClassAllHoldings: function(data, company){
        let companyState, shareClass;
        return transactions.createShareClass(data, company)
            .then(function(){
                return company.getCurrentCompanyState()
            })
            .then(function(_companyState){
                companyState = _companyState;
                return companyState.getShareClasses({
                        include: [{
                            model: ShareClass,
                            as: 'shareClasses'
                        }]
                    })
            })
            .then(function(shareClasses){
                shareClass = shareClasses.dataValues.shareClasses[0].id;
                return companyState.getHoldingList({include: CompanyState.includes.holdings()})
            })
            .then(function(holdingList){
                const actions = holdingList.dataValues.holdings.map(function(h){
                    return {
                        holdingId: h.holdingId,
                        shareClass: shareClass,
                        transactionType: Transaction.types.APPLY_SHARE_CLASS
                    };
                });
                return selfManagedTransactions.apply_share_classes({
                    actions: actions
                }, company);
            })
    }
}



function createTransaction(req, res, type){
    let company, args = actionUtil.parseValues(req), directory, directoryId;
    delete args.id;
    delete args.type;
    delete args.createdById;
    delete args.ownerId;
    return req.file('documents').upload(function(err, uploadedFiles){
        return sequelize.transaction(function(t){
            return Company.findById(req.params.id)
                .then(function(_company) {
                    company = _company;
                    return PermissionService.isAllowed(company, req.user, 'update', Company.tableName)
                })
                .then(function() {
                    args = args.json ? {...args, ...JSON.parse(args.json), json: null} : args;
                    /* if uploadedFiles, find or create a transactions directory, add it to list */
                    if(uploadedFiles && uploadedFiles.length && args.directoryId === undefined && !args.newDirectory){
                        return company.getCurrentCompanyState()
                            .then(companyState => {
                                return companyState.findOrCreateTransactionDirectory()
                                    .then(transactionDirectory => {
                                        return Document.create({
                                            filename: `Transaction ${moment().format('DD/MM/YYYY')}`,
                                            createdById: req.user.id,
                                            ownerId: req.user.id,
                                            type: 'Directory',
                                            directoryId: transactionDirectory.id,
                                            userUploaded: true
                                        })
                                        .then(d => {
                                            directory = d;
                                            directoryId = d.id;
                                        })
                                })
                            })
                    }
                    else if(args.directoryId){
                        directoryId = args.directoryId;
                    }
                    if(args.newDirectory){
                        return Document.create({
                            filename: args.newDirectory,
                            createdById: req.user.id,
                            ownerId: req.user.id,
                            type: 'Directory',
                            directoryId: args.directoryId,
                            userUploaded: true
                        })
                        .then(doc => {
                            directory = doc;
                            directoryId = doc.id;
                        })
                    }
                })
                .then(() => {
                    return Promise.map(uploadedFiles || [], f => {
                        return fs.readFileAsync(f.fd)
                            .then(readFile => {
                                return Document.create({
                                    filename: f.filename,
                                    createdById: req.user.id,
                                    ownerId: req.user.id,
                                    type: f.type,
                                    directoryId: directoryId,
                                    userUploaded: true,
                                    documentData: {
                                        data: readFile,
                                    }
                                }, { include: [{model: DocumentData, as: 'documentData'}]});
                        });
                    })
                })
                .then((files) => {
                    args.documents = files;
                    if(directory){
                        args.documents.push(directory);
                    }
                })
                .then(() => {
                    return transactions[type] ? transactions[type](args, company) : null;
                })
            })
            .then((results) => {
                return selfManagedTransactions[type] ? selfManagedTransactions[type](args, company) : results;
            })
            .then((messages) => {
                return createActivityLog(req.user, company, messages)
                    .then(() => ({
                        message: messages,
                        documentIds:  (args.documents || []).map(d => d.id)
                    }))
            })
            .then((result) => {
                res.json(result);
            })
            .catch(sails.config.exceptions.ValidationException, (e) => {
                res.badRequest(e);
            })
            .catch(sails.config.exceptions.InvalidOperation, (e) => {
                res.badRequest(e);
            })
            .catch(sails.config.exceptions.NameExistsException, (e) => {
                res.badRequest(e);
            })
            .catch(sails.config.exceptions.ForbiddenException, (e) => {
                res.forbidden();
            })
            .catch((e) => {
                res.serverError(e);
            })
    });
}


function deleteTransactions(req, res) {
    let company;
    const transactionIds = req.params.transactionIds.split(';').map(t => parseInt(t, 10));
    return Company.findById(req.params.id)
        .then(function(_company) {
            company = _company;
            return PermissionService.isAllowed(company, req.user, 'update', Company.tableName)
        })
        .then(() => {
            return TransactionService.performFilterOutTransactions(transactionIds, company);
        })
        .then((state) => {
            const messages = [{messages: `Upcoming transaction for ${state.companyName} cancelled`}]
            return createActivityLog(req.user, company, messages)
                .then(() => ({
                    message: messages
                }))
        })

        .then((result) => {
            res.json(result);
        })

        .catch(sails.config.exceptions.ValidationException, (e) => {
            res.badRequest(e);
        })
        .catch(sails.config.exceptions.InvalidOperation, (e) => {
            res.badRequest(e);
        })
        .catch(sails.config.exceptions.NameExistsException, (e) => {
            res.badRequest(e);
        })
        .catch(sails.config.exceptions.ForbiddenException, (e) => {
            res.forbidden();
        })
        .catch((e) => {
            res.serverError(e);
        })
}


module.exports = {
    transactions: transactions,
    selfManagedTransactions: selfManagedTransactions,
    create: (req, res) => {
        createTransaction(req, res, req.params.type)
    },
    createRegisterEntry: function(req, res){
        createTransaction(req, res, 'createRegisterEntry');
    },
    createShareClass: function(req, res){
        createTransaction(req, res, 'createShareClass');
    },
    updateShareClass: function(req, res){
        createTransaction(req, res, 'updateShareClass');
    },
    deleteTransactions: deleteTransactions
};