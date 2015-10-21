/**
 * TransactionController
 *
 * @description :: Server-side logic for managing Transactions
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var Promise = require('bluebird');

var transactions = {
    seed: function(req, res, company) {
        if (!req.body.holdings || !req.body.holdings.length) {
            throw new sails.config.exceptions.ValidationException('Holdings are required');
        }
        sequelize.transaction(function(t){
            return Transaction.create({type: Transaction.types.SEED}, {transaction: t})
            .then(function(transaction){
                this.transaction = transaction;
                return company.setSeedTransaction(transaction, {transaction: t})
            })
            .then(function(company){
                return company.setCurrentTransaction(this.transaction, {transaction: t})
            })
            .then(function(){
                var transactionId = this.transaction.id;
                return Promise.all(req.body.holdings.map(function(s) {
                    return Holding.create(_.merge(s, {transactionId: transactionId, companyId: company.id}), {
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
        })
        .then(function(holdings){
            return company.save();
        })
        .then(function(holdings){
            return res.ok();
        })
        .catch(function(e){
            sails.log.error(e);
            res.serverError(e);
        })
    },
    issue: function(req, res, company){
        " For now, using name equivilency to match holders "
        " Match all holders in a holding, then an issue will increase the parcels on that holding "
        var newHoldings = req.body.holdings
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

        sequelize.transaction(function(t){
            return company.getCurrentTransaction()
             .then(function(currentTransaction){
                return currentTransaction.buildNext({type: Transaction.types.ISSUE})
             })
             .then(function(nextTransaction){
                this.nextTransaction = nextTransaction;
                /* find any matching holders */
                _.some(nextTransaction.holdings, function(nextHolding){
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
                nextTransaction.dataValues.holdings = nextTransaction.dataValues.holdings.concat(newShares);
                return this.nextTransaction.save({transaction: t});
             })
             .then(function(){
                return company.setCurrentTransaction(this.nextTransaction, {transaction: t});
             })
        })
        .then(function(holdings){
            return res.ok();
        })
        .catch(function(e){
            sails.log.error(e);
            res.serverError(e);
        })
    }

}



module.exports = {
    create: function(req, res) {
        var company;
        Company.findById(req.params.companyId, {
                include: [{
                    model: Holding,
                    as: 'holdings'
                }]
            })
            .then(function(_company) {
                company = _company;
                return PermissionService.isAllowed(company, req.user, 'update', Company.tableName)
            })
            .then(function() {
                return transactions[req.params.type](req, res, company);
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