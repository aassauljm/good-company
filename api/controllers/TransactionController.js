/**
 * TransactionController
 *
 * @description :: Server-side logic for managing Transactions
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var Promise = require('bluebird');

var transactions = {
    seed: function(req, res, company) {
        if (!req.body.shareholdings || !req.body.shareholdings.length) {
            throw new sails.config.exceptions.ValidationException('Shareholdings are required');
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
                return Promise.all(req.body.shareholdings.map(function(s) {
                    return Shareholding.create(_.merge(s, {transactionId: transactionId, companyId: company.id}), {
                        include: [{
                            model: Shareholder,
                            as: 'shareholders'
                        }, {
                            model: Parcel,
                            as: 'parcels'
                        }]
                    }, {transaction: t});
                }))
            })
        })
        .then(function(shareholdings){
            return company.save();
        })
        .then(function(shareholdings){
            return res.ok();
        })
        .catch(function(e){
            sails.log.error(e);
            res.serverError(e);
        })
    },
    issue: function(req, res, company){
        " For now, using name equivilency to match shareholders "
        " Match all shareholders in a shareholding, then an issue will increase the parcels on that shareholding "
        var newShareholdings = req.body.shareholdings
        if (!newShareholdings || !newShareholdings.length) {
            throw new sails.config.exceptions.ValidationException('Shareholdings are required');
        }
        newShareholdings.forEach(function(shareholding){
            if(!shareholding.shareholders || !shareholding.shareholders.length){
                throw new sails.config.exceptions.ValidationException('Shareholders are required');
            }
            if(!shareholding.parcels || !shareholding.parcels.length){
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
                /* find any matching shareholders */
                _.some(nextTransaction.shareholdings, function(nextShareholding){
                    var toRemove;
                    newShareholdings.forEach(function(sharesToAdd, i){
                        sharesToAdd = Shareholding.build(sharesToAdd,
                                {include: [{model: Parcel, as: 'parcels'}, {model: Shareholder, as: 'shareholders'}]} );

                        if(nextShareholding.shareholdersMatch(sharesToAdd)){
                            nextShareholding.combineParcels(sharesToAdd);
                            toRemove = i;
                            return false;
                        }
                    })
                    if(toRemove !== undefined){
                        newShareholdings.splice(toRemove, 1);
                    }
                    if(!newShareholdings.length){
                        return true;
                    }
                });

                var newShares = newShareholdings.map(function(sharesToAdd, i){
                    return Shareholding.build(_.extend(sharesToAdd, {companyId: company.id}),
                                {include: [{model: Parcel, as: 'parcels'}, {model: Shareholder, as: 'shareholders'}]});
                });
                nextTransaction.dataValues.shareholdings = nextTransaction.dataValues.shareholdings.concat(newShares);
                return this.nextTransaction.save({transaction: t});
             })
             .then(function(){
                return company.setCurrentTransaction(this.nextTransaction, {transaction: t});
             })
        })
        .then(function(shareholdings){
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
                    model: Shareholding,
                    as: 'shareholdings'
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