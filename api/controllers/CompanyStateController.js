/**
 * CompanyStateController
 *
 * @description :: Server-side logic for managing CompanyStates
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var Promise = require('bluebird');
var _ = require('lodash');
var actionUtil = require('sails-hook-sequelize-blueprints/actionUtil');

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
    });
}


var transactions = {
    seed: function(args, company) {
        if (!args.holdings || !args.holdings.length) {
            throw new sails.config.exceptions.ValidationException('Holdings are required');
        }
        /*var data = { holdings: args.holdings,
                    ;
        if(args.unallocatedParcels){
            data.unallocatedParcels = args.unallocatedParcels
        }*/
        return sequelize.transaction(function(t){
            return company.getCurrentCompanyState()
            .then(function(companyState){
                var fields = companyState ? companyState.nonAssociativeFields(): {};
                return CompanyState.create(_.merge({}, fields, args, {transaction:{type: Transaction.types.SEED}}),
                                           {include: CompanyState.includes.full() })
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
            .then(function(){
                return;
            })
        });
    },
    issue: function(args, company){
        " For now, using name equivilency to match holders (and companyId) "
        " Match all holders in a holding, then an issue will increase the parcels on that holding "
        validateHoldings(args.holdings)
        return sequelize.transaction(function(t){
            return company.getCurrentCompanyState()
            .then(function(currentCompanyState){
                return currentCompanyState.buildNext({transaction: {type: Transaction.types.ISSUE}})
             })
            .then(function(companyState){
                return companyState.combineHoldings(args.holdings).save()
            })
             .then(function(nextCompanyState){
                return company.setCurrentCompanyState(nextCompanyState);
             })
             .then(function(){
                return company.save();
             });
        })
    },
    details: function(args, company){
        return sequelize.transaction(function(t){
            return company.getCurrentCompanyState()
            .then(function(currentCompanyState){
                return currentCompanyState.buildNext(_.merge(args, {transaction: {type: Transaction.types.DETAILS}}))
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
         });
    }
}



module.exports = {
    transactions: transactions,
    create: function(req, res) {
        var company;
        Company.findById(req.params.companyId)
            .then(function(_company) {
                company = _company;
                return PermissionService.isAllowed(company, req.user, 'update', Company.tableName)
            })
            .then(function() {
                return transactions[req.params.type](actionUtil.parseValues(req), company);
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

    }
};