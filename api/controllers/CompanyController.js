/**
 * CompanyController
 *
 * @description :: Server-side logic for managing companies
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

function TransactionStats(transaction){
    var stats = {};
    return transaction.totalShares()
    .then(function(total){
        stats.totalAllocatedShares = total;
        return stats;
    })
}


module.exports = {
    getInfo: function(req, res) {
        Company.findById(req.params.id, {
                include: [{
                    model: Transaction,
                    as: 'currentTransaction',
                    include: Transaction.includes.fullNoJunctions()
                }]
            })
            .then(function(company){
                this.company = company;
                return company.currentTransaction;
            })
            .then(TransactionStats)
            .then(function(stats){
                res.json(_.merge({}, this.company.get(), stats))
            });
    },
    history: function(req, res){
        Company.findById(req.params.id)
            .then(function(company){
                return company.getPreviousTransaction(req.params.generation)
            })
            .then(function(transaction){
                this.transaction = transaction;
                return transaction
            })
            .then(TransactionStats)
            .then(function(stats){
                res.json(_.merge({transaction: this.transaction.get()}, stats))
            })
    }
};