/**
 * CompanyStateController
 *
 * @description :: Server-side logic for managing CompanyStates
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var Promise = require('bluebird');




var transactions = {
    seed: function(args, company) {
        if (!args.holdings || !args.holdings.length) {
            throw new sails.config.exceptions.ValidationException('Holdings are required');
        }
        return sequelize.transaction(function(t){
            return CompanyState.create({transaction:{type: Transaction.types.SEED}}, {transaction: t, include: [{model: Transaction, as: 'transaction'}]})
            .then(function(state){
                this.state = state;
                return company.setSeedCompanyState(this.state, {transaction: t})
            })
            .then(function(company){
                return company.setCurrentCompanyState(this.state, {transaction: t})
            })
            .then(function(){
                var stateId = this.state.id;
                return Promise.all(args.holdings.map(function(s) {
                    return Holding.create(_.merge(s, {companyStateId: stateId, companyId: company.id}), {
                        include: [{
                            model: Holder,
                            as: 'holders'
                        }, {
                            model: Parcel,
                            as: 'parcels'
                        }]
                    }, {transaction: t});
                }))
            })
            .then(function(holdings){
                return company.save();
            })
            .then(function(holdings){
                return;
            })
        });
    },
    issue: function(args, company){
        " For now, using name equivilency to match holders (and companyId) "
        " Match all holders in a holding, then an issue will increase the parcels on that holding "
        var newHoldings = args.holdings
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

        return sequelize.transaction(function(t){
            return company.getCurrentCompanyState()
             .then(function(currentCompanyState){
                return currentCompanyState.buildNext({transaction: {type: CompanyState.types.ISSUE}})
             })
             .then(function(nextCompanyState){
                this.nextCompanyState = nextCompanyState;
                /* find any matching holders */
                _.some(nextCompanyState.holdings, function(nextHolding){
                    var toRemove;
                    newHoldings.forEach(function(sharesToAdd, i){
                        sharesToAdd = Holding.build(sharesToAdd,
                                {include: [{model: Parcel, as: 'parcels'}, {model: Holder, as: 'holders'}]} );
                        if(nextHolding.holdersMatch(sharesToAdd)){
                            nextHolding.combineParcels(sharesToAdd);
                            toRemove = i;
                            return false;
                        }
                    })
                    if(toRemove !== undefined){
                        newHoldings.splice(toRemove, 1);
                    }
                    if(!newHoldings.length){
                        return true;
                    }
                });
                var newShares = newHoldings.map(function(sharesToAdd, i){
                    return Holding.build(_.extend(sharesToAdd, {companyId: company.id}),
                                {include: [{model: Parcel, as: 'parcels'}, {model: Holder, as: 'holders'}]});
                });
                nextCompanyState.dataValues.holdings = nextCompanyState.dataValues.holdings.concat(newShares);
                return this.nextCompanyState.save({transaction: t});
             })
             .then(function(){
                return company.setCurrentCompanyState(this.nextCompanyState, {transaction: t});
             })
             .then(function(){
                return company.save();
             });
        })
    },
    issues: function(args, company){
        " For now, using name equivilency to match holders (and companyId) "
        " Match all holders in a holding, then an issue will increase the parcels on that holding "
        var newHoldings = args.holdings
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

        return sequelize.transaction(function(t){
                return currentCompanyState.buildNext({transaction: {type: CompanyState.types.ISSUE}})
                 .then(function(nextCompanyState){
                    this.nextCompanyState = nextCompanyState;
                    /* find any matching holders */
                    _.some(nextCompanyState.holdings, function(nextHolding){
                        var toRemove;
                        newHoldings.forEach(function(sharesToAdd, i){
                            sharesToAdd = Holding.build(sharesToAdd,
                                    {include: [{model: Parcel, as: 'parcels'}, {model: Holder, as: 'holders'}]} );
                            if(nextHolding.holdersMatch(sharesToAdd)){
                                nextHolding.combineParcels(sharesToAdd);
                                toRemove = i;
                                return false;
                            }
                        })
                        if(toRemove !== undefined){
                            newHoldings.splice(toRemove, 1);
                        }
                        if(!newHoldings.length){
                            return true;
                        }
                    });
                    var newShares = newHoldings.map(function(sharesToAdd, i){
                        return Holding.build(_.extend(sharesToAdd, {companyId: company.id}),
                                    {include: [{model: Parcel, as: 'parcels'}, {model: Holder, as: 'holders'}]});
                    });
                    nextCompanyState.dataValues.holdings = nextCompanyState.dataValues.holdings.concat(newShares);
                    return this.nextCompanyState.save({transaction: t});
                 })
                 .then(function(){
                    return company.setCurrentCompanyState(this.nextCompanyState, {transaction: t});
                 })
                 .then(function(){
                    return company.save();
                 })
        })
    }
}



module.exports = {
    create: function(req, res) {
        var company;
        Company.findById(req.params.companyId)
            .then(function(_company) {
                company = _company;
                return PermissionService.isAllowed(company, req.user, 'update', Company.tableName)
            })
            .then(function() {
                return transactions[req.params.type](req.body, company);
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