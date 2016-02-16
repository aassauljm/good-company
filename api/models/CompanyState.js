/**
 * CompanyState.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */
var _ = require('lodash');
var Promise = require('bluebird');
var months = Sequelize.ENUM('January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December');


module.exports = {
    _config: {
        actions: false,
        shortcuts: false,
        rest: false
    },
    attributes: {
       companyName: {
            type: Sequelize.TEXT,
            index: true,
            allowNull: false,
            validate: {
                len: [1]
            }
        },
        companyNumber: {
            type: Sequelize.TEXT
        },
        nzbn: {
            type: Sequelize.TEXT
        },
        incorporationDate: {
            type: Sequelize.DATE
        },
        companyStatus: {
            type: Sequelize.TEXT
        },
        entityType: {
            type: Sequelize.TEXT
        },
        constiutionFiled: {
            type: Sequelize.BOOLEAN
        },
        arFilingMonth: {
            type: months
        },
        fraReportingMonth: {
            type: months
        },
        registeredCompanyAddress: {
            type: Sequelize.TEXT
        },
        addressForShareRegister: {
            type: Sequelize.TEXT
        },
        addressForService: {
            type: Sequelize.TEXT
        },
        ultimateHoldingCompany: {
            type: Sequelize.BOOLEAN
        }
    },
    associations: function(n) {
        CompanyState.belongsTo(Transaction, {
            as: 'transaction',
            foreignKey: {
                name: 'transactionId',
                as: 'transaction'
            }
        });
        CompanyState.hasMany(Holding, {
            as: 'holdings',
            foreignKey: {
                name: 'companyStateId',
                as: 'holdings'
            }
        });
        CompanyState.belongsTo(CompanyState, {
            as: 'previousCompanyState',
            foreignKey: {
                name: 'previousCompanyStateId',
                as: 'previousCompanyState'
            }
        });
        // TODO, make a scoped query or something
        CompanyState.belongsToMany(Parcel, {
            as: 'unallocatedParcels',
            notNull: true,
            foreignKey: {
                as: 'parcels',
                name: 'companyStateId'
            },
            through: 'parcelCJ'
        });
        CompanyState.hasMany(Director, {
            as: 'directors',
            foreignKey: {
                name: 'companyStateId',
                as: 'directors',
            }
        });
        /*CompanyState.belongsToMany(Parcel, {
            as: 'overallocatedParcels',
            notNull: true,
            foreignKey: {
                as: 'parcelss',
                name: 'companyStateId'
            },
            through: 'parcelCCJ'
        });*/
    },
    options: {
        freezeTableName: true,
        tableName: 'companystate',
        classMethods: {
            includes: {
                full: function(){
                    return [
                    {
                        model: Holding,
                        as: 'holdings',
                        include: [{
                            model: Parcel,
                            as: 'parcels'
                        }, {
                            model: Person,
                            as: 'holders',
                            include: [{
                                model: Transaction,
                                as: 'transaction',
                            }]
                        },{
                            model: Transaction,
                            as: 'transaction',
                        }]
                    },{
                        model: Parcel,
                        as: 'unallocatedParcels'
                    },{
                        model: Transaction,
                        as: 'transaction',
                        include: [
                            {
                                model: Transaction,
                                as: 'childTransactions'
                            }
                        ]
                    }, {
                         model: Director,
                         as: 'directors',
                         include: [
                            {
                                model: Person,
                                as: 'person'
                            }
                         ]

                    }]
                },
                fullNoJunctions: function(){
                    return [
                    {
                        model: Holding,
                        as: 'holdings',
                        include: [{
                            model: Parcel,
                            as: 'parcels',
                            through: {attributes: []}
                        }, {
                            model: Person,
                            as: 'holders',
                            through: {attributes: []},
                            include: [{
                                model: Transaction,
                                as: 'transaction',
                            }]
                        },{
                            model: Transaction,
                            as: 'transaction',
                        }]
                    },{
                        model: Parcel,
                        as: 'unallocatedParcels'
                    },{
                        model: Transaction,
                        as: 'transaction',
                        include: [
                            {
                                model: Transaction,
                                as: 'childTransactions'
                            }
                        ]
                    }, {
                         model: Director,
                         as: 'directors',
                         include: [
                            {
                                model: Person,
                                as: 'person'
                            }
                         ]

                    }]
                }
            },
            ordering: {
                full: function(){
                    return [
                        [{model: Holding, as: 'holdings'}, 'id', 'ASC'],
                        [{model: Holding, as: 'holdings'}, {model: Parcel, as: 'parcels'}, 'shareClass', 'ASC'],
                        [{model: Holding, as: 'holdings'}, {model: Person, as: 'holders'}, 'name', 'ASC'],
                        [{model: Director, as: 'directors'}, {model: Person, as: 'person'}, 'name', 'ASC'],
                    ]
                }
            },

            populatePersonIds: function(persons){
                // TODO, collaspse, subset of graph
                persons = _.cloneDeep(persons)
                return Promise.map(persons || [], function(person){
                    return AddressService.normalizeAddress(person.address)
                        .then(function(address){
                            return Person.find({where: person})
                            .then(function(p){
                                if(p){
                                    person.personId = p.personId
                                }
                            })
                        })
                })
                .then(function(){
                    return persons;
                })
            },

            findOrCreatePersons: function(obj){
                // persons can be in:
                // obj.holdings.holders
                // obj.directors.persons
                obj = _.cloneDeep(obj)
                return Promise.each(obj.holdings || [], function(holding){
                    return Promise.map(holding.holders || [], function(holder){
                        return AddressService.normalizeAddress(holder.address)
                            .then(function(address){
                                holder = _.merge({}, holder, {address: address})
                                return Person.findOrCreate({where: holder, defaults: holder})
                                    .spread(function(holder){
                                        return holder;
                                    });
                            });
                    })
                    .then(function(holders){
                        holding.holders = holders;
                    });
                })
                .then(function(){
                     return Promise.each(obj.directors || [], function(director){
                        return AddressService.normalizeAddress(director.person.address)
                            .then(function(address){
                                director.person = _.merge({}, director.person, {address: address});
                                return Person.findOrCreate({where: director.person, defaults: director.person})
                                .spread(function(person){
                                    director.person = person;
                                })
                            });
                     });
                })
                .then(function(){
                    return obj;
                })
            },


            createDedupPersons: function(args){
                return CompanyState.findOrCreatePersons(args)
                    .then(function(args){
                        var state = CompanyState.build(args, {include: CompanyState.includes.full()});
                        (state.get('holdings') || []).map(function(h){
                            h.get('holders').map(function(h){
                                h.isNewRecord = false;
                                h._changed = {};
                            })
                        });
                        (state.get('directors') || []).map(function(d){
                            d.get('person').isNewRecord = false;
                            d._changed = {};
                        });
                        return state.save();
                    });
            }
        },
        instanceMethods: {
            getTransactionSummary: function(){
                return sequelize.query('select transaction_summary(:id)',
                                       { type: sequelize.QueryTypes.SELECT,
                                            replacements: { id: this.id}});
            },
            groupShares: function() {
                return this.getHoldings({
                        include: [{
                            model: Parcel,
                            as: 'parcels'
                        }]
                    })
                    .then(function(holdings) {
                        return _.groupBy(_.flatten(holdings.map(function(s) {
                            return s.parcels;
                        })), function(p) {
                            return p.shareClass;
                        });
                    })
            },
            groupTotals: function() {
                return this.groupShares()
                    .then(function(groups) {
                        return Promise.reduce(_.values(groups), function(acc, shares) {
                            var result = _.reduce(shares, function(total, share) {
                                    return total.combine(share);
                                }, Parcel.build({
                                    shareClass: shares[0].shareClass,
                                    amount: 0
                                }));
                            acc[result.shareClass] = result.get();
                            return acc;
                        }, {});
                    });
            },
            totalAllocatedShares: function() {
                return Promise.resolve(this.isNewRecord ? this.dataValues.holdings : this.getHoldings({
                        include: [{
                            model: Parcel,
                            as: 'parcels',
                        }]
                    }))
                    .then(function(holdings) {
                        return _.sum(_.flatten(holdings.map(function(s) {
                            return s.parcels;
                        })), function(p) {
                            return p.amount;
                        });
                    })
            },
            totalUnallocatedShares: function() {
                return Promise.resolve(this.isNewRecord ? this.dataValues.unallocatedParcels : this.getUnallocatedParcels())
                    .then(function(parcels) {
                        return _.sum(parcels, function(p) {
                            return p.amount;
                        });
                    })
            },
            cloneHoldings: function() {
                return this.getHoldings({
                        include: [{
                            model: Parcel,
                            as: 'parcels',
                            // drop junction info
                            through: {attributes: []}
                        }, {
                            model: Person,
                            as: 'holders',
                            through: {attributes: []}
                        }]
                    })
                    .then(function(holdings) {
                        return {holdings: holdings.map(function(holding) {
                            var parcels = holding.parcels.map(function(p) {
                                return p.get()
                            });
                            var holders = holding.holders.map(function(p) {
                                return p.get()
                            });
                            return {
                                holdingId: holding.holdingId,
                                name: holding.name,
                                parcels: parcels,
                                holders: holders
                            };
                        })};

                    })
            },

            cloneUnallocated: function(){
                return this.getUnallocatedParcels()
                    .then(function(parcels){
                        return {unallocatedParcels: parcels.map(function(p){
                            return p.get();
                        })};
                    });
            },

            cloneDirectors: function(){
                return this.getDirectors({
                        include: [{
                            model: Person,
                            as: 'person'
                        }]
                    })
                    .then(function(directors){
                        return {directors: directors.map(function(p){
                            return _.omit(p.get(), 'id', 'companyStateId');
                        })};
                    });
            },


            nonAssociativeFields: function(){
                return _.omit(_.pick.apply(_, [this.dataValues].concat(_.keys(CompanyState.attributes))), 'id');
            },

            buildNext: function(attr) {
                var id = this.id;
                var currentFields = this.nonAssociativeFields();
                return Promise.join(this.cloneHoldings(), this.cloneUnallocated(), this.cloneDirectors(),
                        function(holdings, unallocatedParcels, directors) {
                        return CompanyState
                            .build(_.merge(currentFields, {
                                previousCompanyStateId: id
                            }, holdings, unallocatedParcels, directors, attr), {
                                include: CompanyState.includes.fullNoJunctions()
                            })
                    })
                    .then(function(state){
                        // items with id are not newRecords
                        state.get('holdings').map(function(sh){
                            sh.get('holders').map(function(holder){
                                holder.isNewRecord = false;
                                holder._changed = {};
                            })
                            sh.get('parcels').map(function(parcel){
                                parcel.isNewRecord = false;
                                parcel._changed = {}
                            })
                        });
                        state.get('unallocatedParcels').map(function(p){
                            p.isNewRecord = false;
                            p._changed = {};
                        });
                        state.get('directors').map(function(p){
                            p.person.isNewRecord = false;
                            p.person._changed = {};
                        });
                        return state;
                    })
            },

            buildPrevious: function(attr){
                return this.buildNext(attr)
                    .then(function(state){
                        state.dataValues.previousCompanyStateId = null;
                        return state;
                    })
            },

            createPrevious: function(attr){
                var self = this, prev;
                return this.buildPrevious(_.merge(attr, {transactionId: null, transaction: null}))
                    .then(function(_prev){
                        prev = _prev;
                        return prev.save();
                    })
                    .then(function(prev){
                        self.setPreviousCompanyState(prev);
                        return self.save();
                    });
            },


            combineHoldings: function(newHoldings, parcelHint, transaction, subtractHoldings){
                // add these holdings to current holdings
                if(this.id){
                    throw new sails.config.exceptions.BadImmutableOperation();
                }
                sails.log.verbose('Adding holdings to companystate')
                " For now, using name equivilency to match holders (and companyId) "
                " Match all holders in a holding, then an issue will increase the parcels on that holding "
                _.some(this.dataValues.holdings, function(nextHolding){
                    var toRemove;
                    newHoldings.forEach(function(holdingToAdd, i){
                        //holdingToAdd = Holding.buildDeep(holdingToAdd);

                        if(((holdingToAdd.holderId && nextHolding.holderId === holdingToAdd.holderId ) ||
                            nextHolding.holdersMatch(holdingToAdd)) &&
                           (!parcelHint || nextHolding.parcelsMatch({parcels: parcelHint}))){
                            if(subtractHoldings){
                                nextHolding.subtractParcels(holdingToAdd);
                                if(transaction)
                                    nextHolding.dataValues.transaction = transaction;
                            }
                            else{
                                nextHolding.combineParcels(holdingToAdd);
                                if(transaction)
                                    nextHolding.dataValues.transaction = transaction;
                            }
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
                var extraHoldings = newHoldings.map(function(holdingToAdd, i){
                    // TODO, make sure persons are already looked up
                    const extraHolding = Holding.buildDeep(holdingToAdd)
                    if(transaction){
                        extraHolding.dataValues.transaction = transaction;
                    }
                    return extraHolding;
                });
                if(subtractHoldings && extraHoldings.length){
                    throw new sails.config.exceptions.InvalidInverseOperation('Unknown holders to issue to');
                }
                this.dataValues.holdings = this.dataValues.holdings.concat(extraHoldings);
                // unaccounted for, alter unallocated shares
                return this;
            },

            subtractHoldings: function(subtractHoldings, parcelHint, transaction){
                return this.combineHoldings(subtractHoldings, parcelHint, transaction, true);
            },

            mutateHolders: function(holding, newHolders, transaction){
                //these new holders may have new members or address changes or something
                newHolders = newHolders.slice()
                var existingHolders = [];
                _.some(holding.dataValues.holders, function(holder){
                    var toRemove;
                    newHolders.forEach(function(newHolder, i){
                        if(holder.detailChange(newHolder)){
                            existingHolders.push(holder.replaceWith(newHolder))
                            toRemove = i;
                            return false;
                        }
                        if(holder.isEqual(newHolder)){
                            existingHolders.push(holder);
                            toRemove = i;
                            return false;
                        }
                    });
                    if(toRemove !== undefined){
                        newHolders.splice(toRemove, 1);
                    }
                    if(!newHolders.length){
                        return true;
                    }
                });
                var extraHolders = newHolders.map(function(holderToAdd, i){
                    // TODO, make sure persons are already looked up
                    return Person.build(holderToAdd)
                })
                holding.dataValues.holders = existingHolders.concat(extraHolders);
                if(transaction){
                    holding.dataValues.transaction = transaction;
                }
                return this;
            },

            replaceHolder: function(currentHolder, newHolder, transaction){
                var builtNewHolder;
                this.dataValues.holdings.map(function(holding){
                    var index = _.findIndex(holding.dataValues.holders, function(h, i){
                        return h.isEqual(currentHolder);
                    });
                    if(index > -1){
                        holding.dataValues.holders[index] = builtNewHolder || holding.dataValues.holders[index].replaceWith(newHolder);
                        builtNewHolder = holding.dataValues.holders[index];
                        if(transaction){
                            builtNewHolder.dataValues.transaction = transaction;
                        }
                    }
                });
                return this;
            },

            replaceDirector: function(currentDirector, newDirector, transaction){
                var index = _.findIndex(this.dataValues.directors, function(d, i){
                        return d.person.isEqual(currentDirector);
                });

                if(index > -1){
                    this.dataValues.directors[index].personId = null;
                    this.dataValues.directors[index].dataValues.person = this.dataValues.directors[index].dataValues.person.replaceWith(newDirector);
                    if(transaction){
                        this.dataValues.directors[index].person.dataValues.transaction =transaction
                    }
                }
                else{
                    throw new sails.config.exceptions.InvalidInverseOperation('Unknown director to replace');
                }
                return this;
            },

            getMatchingHolding: function(holders, parcelHint, ignoreCompanyNumber){
                return _.find(this.dataValues.holdings, function(holding){
                    return holding.holdersMatch({holders: holders}, ignoreCompanyNumber) && (!parcelHint || holding.parcelsMatch({parcels: parcelHint}));
                });
            },

            getHoldingBy: function(data){
                return _.find(this.dataValues.holdings, function(holding){
                    return _.isMatch(holding.get(), data)
                });
            },

            getHolderBy: function(data){
                // probably has to collapse whole tree for this to work
                var result;
                 _.some(this.dataValues.holdings, function(holding){
                    return _.some(holding.dataValues.holders, function(holder){
                        if(holder.isEqual(data)){
                            result = holder;
                            return result;
                        }
                    });
                });

                return result;
            },

            combineUnallocatedParcels: function(parcel, subtract){
                var match, result;
                var parcel = Parcel.build(parcel);
                _.some(this.dataValues.unallocatedParcels, function(p){
                    if(Parcel.match(p, parcel)){
                        match = p;
                        return p;
                    }
                });
                if(match){
                   this.dataValues.unallocatedParcels = _.without(this.dataValues.unallocatedParcels, match);
                }
                else{
                    match = Parcel.build({amount: 0, shareClass: parcel.shareClass});
                }
                if(!subtract){
                    result = match.combine(parcel);
                }
                else{
                    result = match.subtract(parcel);
                }
                this.dataValues.unallocatedParcels.push(result);
                this.dataValues.unallocatedParcels = _.filter(this.dataValues.unallocatedParcels, function(p){
                    return p.amount;
                });
                return this;
            },

            subtractUnallocatedParcels: function(parcel){
                return this.combineUnallocatedParcels(parcel, true);
            },

            stats: function(){
                var stats = {};
                return Promise.join(this.totalAllocatedShares(), this.totalUnallocatedShares(), this.getTransactionSummary(),
                        function(total, totalUnallocated, transactionSummary){
                        stats.totalUnallocatedShares = totalUnallocated;
                        stats.totalAllocatedShares = total;
                        stats.totalShares = stats.totalAllocatedShares + stats.totalUnallocatedShares;
                        stats.transactions = transactionSummary[0].transaction_summary;
                        return stats
                    });
            }

        },
        hooks: {
            beforeCreate: function(companyState){
                return Promise.join(
                                    AddressService.normalizeAddress(companyState.registeredCompanyAddress),
                                    AddressService.normalizeAddress(companyState.addressForShareRegister),
                                    AddressService.normalizeAddress(companyState.addressForService))
                    .spread(function(registeredCompanyAddress, addressForShareRegister, addressForService){
                        companyState.registeredCompanyAddress = registeredCompanyAddress;
                        companyState.addressForShareRegister = addressForShareRegister;
                        companyState.addressForService = addressForService;
                    })

            }

        }
    }
};