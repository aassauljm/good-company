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
        const sum = calcSum(issue, Transaction.types.ISSUE_UNALLOCATED);
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
                actions.push({
                    amount: classes[c],
                    shareClass: cInt,
                    effectiveDate: new Date(),
                    transactionType: Transaction.types.ISSUE_UNALLOCATED
                });
                ((args.holdingList || {}).holdings || []).map((h) => {
                    h.parcels.filter(p => p.shareClass === cInt).map(p => {
                        actions.push({
                            transactionType: Transaction.types.ISSUE_TO,
                            transactionMethod: Transaction.types.AMEND,
                            holders: h.holders,
                            shareClass: cInt,
                            amount: p.amount,
                            beforeAmount: p.beforeAmount,
                            afterAmount: p.afterAmount
                        })
                    })
                })
                sets.push({
                    effectiveDate: new Date(),
                    actions: actions
                });
            });

        if(!sets.length){
            throw new sails.config.exceptions.ValidationException('Parcels are required')
        }
        return TransactionService.performAll(sets, company)
        .then(() => {
            return {message: `Shares issued`}
        })
    },


    details: function(args, company){
        let name;
        return company.getCurrentCompanyState()
        .then(function(currentCompanyState){
            return currentCompanyState.buildNext(_.merge({}, args, {
                transaction: {type: Transaction.types.DETAILS, data: args, effectiveDate: new Date() }
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
        let state, date = args.transactions[0].effectiveDate || new Date();
        // TODO directorUpdate and holderchange should generate in same set
        if(args.documents){
            args.transactions.map(t => t.documents = args.documents);
        }
        return TransactionService.performAll(args.transactions || [], company)
            .then(_state => {
                state = _state;
                // e.g. remove empty allocation
                return TransactionService.createImplicitTransactions(state, args.transactions || [], date)
            })
            .then(transactions => {
                if(transactions.length){
                    return TransactionService.performAll(transactions, company, state);
                }
            })
            .then(() => {
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
            const attributes = {name: data.name, properties: _.omit(data, 'name')}
            return ShareClass.create(attributes, {include: [{model: Document, as: 'documents', include: [
                                            {model: DocumentData, as: 'documentData'}
                                        ]}]})
        })
        .then(function(shareClass){
            shareClass.validate();
            return shareClasses.addShareClass(shareClass)
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
            return {message: `Share Class created for ${companyState.companyName}.`}
        })
    }
}

const selfManagedTransactions = {
     apply_share_classes: function (data, company){
        /* to apply, retroactively, a share class:
            * clone current state without apply previousCompanyStateId.
            * set shareClass ids on parcels
            * replay all historical actions

            * perhaps keep a reference to previous head?
            * perhaps flag companyState to show that share classes have been applied?
        */
        let state;
        return sequelize.transaction(function(t){
            return TransactionService.performTransaction({
                    actions: data.actions,
                    effectiveDate: data.effectiveDate || new Date(),
                    transactionType: Transaction.types.APPLY_SHARE_CLASSES
                }, company)
                .then(_state => {
                    state = _state;
                    // wipe history
                    state.set('previousCompanyStateId', null);
                    return state.save();
                })
                // create previous
                .then(() => company.createPrevious())
                .then(function(_state){
                    // point pending history current existing history
                    _state.set('pending_historic_action_id', _state.get('historic_action_id'));
                    return _state.save();
                })
            })
            .then(() => {
                //return TransactionService.performInverseAllPending(company)
            })
            .then(function(){
                return {
                    message: `Share Classes applied for ${state.companyName}.`
                }
            });
    },
}



function createTransaction(req, res, type){
    let company, args = actionUtil.parseValues(req);
    delete args.type;
    delete args.createdById;
    delete args.ownerId;
    return req.file('documents').upload(function(err, uploadedFiles){
        return sequelize.transaction(function(t){
            return Company.findById(req.params.companyId)
                .then(function(_company) {
                    company = _company;
                    return PermissionService.isAllowed(company, req.user, 'update', Company.tableName)
                })
                .then(function() {
                    return Promise.map(uploadedFiles || [], f => {
                        return fs.readFileAsync(f.fd)
                            .then(readFile => {
                                return Document.create({
                                    filename: f.filename,
                                    createdById: req.user.id,
                                    ownerId: req.user.id,
                                    type: f.type,
                                    documentData: {
                                        data: readFile,
                                    }
                                }, { include: [{model: DocumentData, as: 'documentData'}]});
                        });
                    })
                })
                .then((files) => {
                    args = args.json ? JSON.parse(args.json) : args;
                    args.documents = files;
                })
                .then((results) => {
                    return transactions[type] ? transactions[type](args, company) : null;
                })
            })
            .then((results) => {
                return selfManagedTransactions[type] ? selfManagedTransactions[type](args, company) : results;
            })
            .then((results) => {
                return createActivityLog(req.user, company, results)
                    .then(() => results)
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



module.exports = {
    transactions: transactions,
    create: (req, res) => {
        createTransaction(req, res, req.params.type)
    },
    createRegisterEntry: function(req, res){
        createTransaction(req, res, 'createRegisterEntry');
    },
    createShareClass: function(req, res){
        createTransaction(req, res, 'createShareClass');
    }
};