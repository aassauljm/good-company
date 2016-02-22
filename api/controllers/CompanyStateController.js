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
            if(parcel.amount < 1)
                throw new sails.config.exceptions.ValidationException('Parcels amounts must be positve');
        });
    });
}


// TODO, move to transaction service
var transactions = {
    seed: function(args, company, date) {
        if(!args.holdings || !args.holdings.length) {
            throw new sails.config.exceptions.ValidationException('Holdings are required');
        }
        /*
        if(args.unallocatedParcels){
            data.unallocatedParcels = args.unallocatedParcels
        }*/
        return company.getCurrentCompanyState()
            .then(function(companyState){
                var fields = companyState ? companyState.nonAssociativeFields() : {};
                return CompanyState.createDedupPersons(_.merge({}, fields, args, {transaction:{type: Transaction.types.SEED, effectiveDate: date || new Date()}}));
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
        " For now, using name equivilency to match holders (and companyId) "
        " Match all holders in a holding, then an issue will increase the parcels on that holding "
        validateHoldings(args.holdings)
        return company.getCurrentCompanyState()
        .then(function(currentCompanyState){
            return currentCompanyState.buildNext({transaction: {type: Transaction.types.COMPOUND, data: args, effectiveDate: new Date() }})
         })
        .then(function(companyState){
            //TODO add transaction
            companyState.combineHoldings(args.holdings);
            return companyState.save()
        })
         .then(function(nextCompanyState){
            return company.setCurrentCompanyState(nextCompanyState);
         })
         .then(function(){
            return company.save();
         });
    },
    details: function(args, company){
        return company.getCurrentCompanyState()
        .then(function(currentCompanyState){
            return currentCompanyState.buildNext(_.merge(args, {transaction: {type: Transaction.types.DETAILS, data: args, effectiveDate: new Date() }}))
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
    }
}


function createRegisterEntry(data, company){
    let companyState, register;
    return company.getCurrentCompanyState()
        .then(function(currentCompanyState){
            return currentCompanyState.buildNext({transaction: {type: Transaction.types.REGISTER_ENTRY, data: data, effectiveDate: new Date() }});
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


module.exports = {
    transactions: transactions,
    create: function(req, res) {
        let company;
        return sequelize.transaction(function(t){
            return Company.findById(req.params.companyId)
                .then(function(_company) {
                    company = _company;
                    return PermissionService.isAllowed(company, req.user, 'update', Company.tableName)
                })
                .then(function() {
                    return transactions[req.params.type](actionUtil.parseValues(req), company);
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

    },
    createRegisterEntry: function(req, res){
        let company;
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
    }
};