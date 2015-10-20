/**
 * CompanyController
 *
 * @description :: Server-side logic for managing companies
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

function CompanyStats(company){
    var stats = {};
    return company.currentTransaction.totalShares()
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
                    include: Transaction.includes.full()
                }]
            })
            .then(function(company){
                this.company = company;
                return company;
            })
            .then(CompanyStats)
            .then(function(stats){
                res.json(_.merge({}, this.company.get(), stats))
            });
    },
    history: function(req, res){
        Company.findById(req.params.id)
            .then(function(company){
                res.json(company)
            });
    }
};