// api/models/Holdings.js

var _ = require('lodash');
var Promise = require('bluebird');


module.exports = {

    attributes: {
    },
    associations: function(){
        HoldingList.belongsToMany(Holding, {
            as: 'holdings',
            foreignKey: 'holdings_id',
            through: 'h_list_j'
        });
        HoldingList.hasMany(CompanyState, {
            as: 'companyState',
            foreignKey: 'h_list_id'
        });
    },
    options: {
        freezeTableName: false,
        tableName: 'holding_list',
        classMethods: {},
        instanceMethods: {
            buildNext: function(){
                if(this.isNewRecord){
                    return Promise.resolve(this);
                }
                var self = this;
                return (this.dataValues.holdings ? Promise.resolve(this.dataValues.holdings) :
                        this.getHoldings({include: [{
                                model: Parcel,
                                as: 'parcels',
                                through: {
                                    attributes: []
                                }
                            }, {
                                model: Holder,
                                as: 'holders',
                                include:[{
                                    model: Person,
                                    as: 'person',
                                    include: [{
                                        model: Transaction,
                                        as: 'transaction',
                                    }]
                                }]
                            }, {
                                model: Transaction,
                                as: 'transaction',
                            }],
                            order: [
                                ['id', 'ASC'],
                                [{
                                    model: Holding,
                                    as: 'holdings'
                                },{
                                    model: Parcel,
                                    as: 'parcels'
                                }, 'shareClass', 'ASC'],
                                [{
                                    model: Holding,
                                    as: 'holdings'
                                },{
                                    model: Holder,
                                    as: 'holder'
                                },{
                                    model: Person,
                                    as: 'holders'
                                }, 'name', 'ASC']
                                ]
                            }))
                    .then(function(holdings){
                        return HoldingList.build({holdings: holdings.map(h => _.merge({}, h.toJSON()))}, {
                            include: [{
                                model: Holding,
                                as: 'holdings',
                                through: {
                                    attributes: []
                                },
                                include: [{
                                    model: Parcel,
                                    as: 'parcels',
                                    through: {
                                        attributes: []
                                    }
                                }, {
                                    model: Holder,
                                    as: 'holders',
                                    include:[{
                                        model: Person,
                                        as: 'person',
                                        include: [{
                                            model: Transaction,
                                            as: 'transaction',
                                        }]
                                    }]
                                }, {
                                    model: Transaction,
                                    as: 'transaction',
                                }]
                              }]})
                    })
                    .then(function(holdingList){
                        holdingList.dataValues.holdings.map(function(r){
                            r.isNewRecord = false;
                            r._changed = {};
                            r.dataValues.holders.map(h => {
                                h.isNewRecord = false;
                                h._changed = {};
                            });
                            r.dataValues.parcels.map(p => {
                                p.isNewRecord = false;
                                p._changed = {};
                            })
                        });
                        return holdingList;
                    })
            }
        },
        hooks: {}
    }
};
