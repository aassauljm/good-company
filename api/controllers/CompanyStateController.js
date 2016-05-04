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


// TODO, move to transaction service
var transactions = {
    seed: function(args, company, date) {
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
                return CompanyState.createDedup(_.merge({}, fields, args, {transaction:{type: Transaction.types.SEED, effectiveDate: date || new Date()}}));
            })
            .then(function(state){
                this.state = state;
                return company.setSeedCompanyState(this.state)
            })
            .then(function(company){
                return company.setCurrentCompanyState(this.state)
            })
            .then(function(){
                return company.save();
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
                const cInt = parseInt(c, 10)
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
                })
            });
        if(!sets.length){
            throw new sails.config.exceptions.ValidationException('Holdings are required');
        }
        return TransactionService.performAll(sets, company);
    },


    details: function(args, company){
        return company.getCurrentCompanyState()
        .then(function(currentCompanyState){
            return currentCompanyState.buildNext(_.merge({}, args, {
                transaction: {type: Transaction.types.DETAILS, data: args, effectiveDate: new Date() }
            }))
        })
        .then(function(nextCompanyState){
            return nextCompanyState.save();
        })
        .then(function(nextCompanyState){
            return company.setCurrentCompanyState(nextCompanyState);
        })
        .then(function(){
            return company.save();
        });
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
                return TransactionService.createImplicitTransactions(state, date)
            })
            .then(transactions => {
                if(transactions){
                    return TransactionService.performAll(transactions, company, state);
                }
            })
            .then(() => {
                if(args.documents){
                    return Promise.all(args.documents.map(d => d.update({date: date})));
                }
            });
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
                    state.set('previousCompanyStateId', null);
                    return state.save();
                })
                // create previous
                .then(() => company.createPrevious())
                .then(state => {
                    return state.getHistoricalActions();
                })
            })
            .then(actions => {
                return TransactionService.performInverseAll(actions.actions.slice(1), company);
            })
            .then(function(){
                return {message: 'Share classes applied.'}
            })
    },
}


function createRegisterEntry(data, company){
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
            return {message: 'Entry created.'}
        })
}

function createShareClass(data, company){
    let companyState, shareClasses;
    return company.getCurrentCompanyState()
        .then(function(currentCompanyState){
            return currentCompanyState.buildNext({
                transaction: {type: Transaction.types.CREATE_SHARE_CLASS, data: _.omit(data, 'documents'), effectiveDate: new Date() }
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
        .then(function(nextCompanyState){
            return company.setCurrentCompanyState(companyState);
         })
        .then(function(){
            return {message: 'Share Class created.'}
        })
}


module.exports = {
    transactions: transactions,
    create: function(req, res) {
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
                    .then(function() {
                        return transactions[req.params.type] ? transactions[req.params.type](args, company) : null;
                    })
                })
                .then(function() {
                    return selfManagedTransactions[req.params.type] ? selfManagedTransactions[req.params.type](args, company) : null;
                })
                .then(() => {
                    return TransactionService.createActivityLog(req.user, company.id, args.transactions);
                })
                .then(function(result){
                    res.json(result);
                })
                .catch(sails.config.exceptions.ValidationException, function(e) {
                    res.serverError(e);
                })
                .catch(sails.config.exceptions.ForbiddenException, function(e) {
                    res.forbidden();
                })
                .catch(function(e) {
                    res.serverError(e);
                })
        });

    },
    createRegisterEntry: function(req, res){
        let company;
        // merge with above
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
                                    return {
                                        filename: f.filename,
                                        createdById: req.user.id,
                                        ownerId: req.user.id,
                                        type: f.type,
                                        documentData: {
                                            data: readFile,
                                        }
                                    };
                            });
                        })
                    })
                    .then(function(files){
                        const values = actionUtil.parseValues(req);
                        values.documents = files;
                        values.persons = values.persons.split(',').map(p => parseInt(p, 10));
                        return createRegisterEntry(values, company);
                    })
                })
                .then(function(result){
                    res.ok(result);
                })
                .catch(sails.config.exceptions.ValidationException, function(e) {
                    res.serverError(e);
                })
                .catch(sails.config.exceptions.ForbiddenException, function(e) {
                    res.forbidden();
                })
                .catch(function(e) {
                    res.serverError(e);
                })
            })
    },
    createShareClass: function(req, res){
        let company;
        // merge with above
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
                                    return {
                                        filename: f.filename,
                                        createdById: req.user.id,
                                        ownerId: req.user.id,
                                        type: f.type,
                                        documentData: {
                                            data: readFile,
                                        }
                                    };
                            });
                        })
                    })
                    .then(function(files){
                        let values = actionUtil.parseValues(req);
                        values = JSON.parse(values.json || '{}');
                        values.documents = files;
                        return createShareClass(values, company);
                    })
                })
                .then(function(result){
                    res.ok(result);
                })
                .catch(sails.config.exceptions.ValidationException, function(e) {
                    res.serverError(e);
                })
                .catch(sails.config.exceptions.ForbiddenException, function(e) {
                    res.forbidden();
                })
                .catch(function(e) {
                    res.serverError(e);
                })
            })
    }
};