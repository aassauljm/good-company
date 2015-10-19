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
            .spread(function(){
                return this.transaction.getShareholdings()
            }).then(function(shareholdings){
                return res.ok();
            })
            .catch(function(e){
                sails.log.error(e);
                 return res.serverError();
            })
            .then(function(){
            });
        });
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
                console.log(e)
                res.forbidden();
            })
            .catch(function(e) {
                console.log(e)
                res.serverError(e);
            })

    }
};