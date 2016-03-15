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
        CompanyState.belongsTo(HoldingList, {
            as: 'holdingList',
            foreignKey: {
                name: 'h_list_id',
                as: 'holdingList'
            }
        });
        CompanyState.belongsTo(CompanyState, {
            as: 'previousCompanyState',
            foreignKey: {
                name: 'previousCompanyStateId',
                as: 'previousCompanyState'
            }
        });
        CompanyState.belongsToMany(Parcel, {
            as: 'unallocatedParcels',
            notNull: true,
            foreignKey: {
                as: 'parcels',
                name: 'companyStateId'
            },
            through: 'parcelCJ'
        });
        CompanyState.belongsTo(DirectorList, {
            as: 'directorList',
            foreignKey: {
                as: 'directors',
                name: 'director_list_id'
            }
        });
        CompanyState.belongsTo(InterestsRegister, {
            as: 'iRegister',
            foreignKey: {
                as: 'iRegister',
                name: 'register_id'
            }
        });
        CompanyState.belongsTo(DocumentList, {
            as: 'docList',
            foreignKey: {
                as: 'docList',
                name: 'doc_list_id'
            }
        });
        CompanyState.belongsTo(ShareClasses, {
            as: 'shareClasses',
            foreignKey: {
                as: 'shareClasses',
                name: 's_classes_id'
            }
        });
        CompanyState.belongsTo(Actions, {
            as: 'historicalActions',
            foreignKey: {
                as: 'historicalActions',
                name: 'historical_action_id'
            }
        });
    },
    options: {
        freezeTableName: true,
        tableName: 'company_state',
        classMethods: {
            includes: {
                full: function(){
                    return [
                    {
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
                    }]
                },
                fullNoJunctions: function(seperate){
                    return [
                    {
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
                    }]
                },
                holdingList: function(){
                    return [{
                        model: HoldingList,
                        as: 'holdingList',
                        include: [{
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
                        }]
                    }]
                },
                unallocatedParcels: function(){
                    return [{
                        model: Parcel,
                        as: 'unallocatedParcels'
                    }];
                },
                transaction: function(){
                    return [{
                        model: Transaction,
                        as: 'transaction',
                        include: [
                            {
                                model: Transaction,
                                as: 'childTransactions'
                            }
                        ]
                    }]
                },
                directorList: function(){
                    return [{
                         model: DirectorList,
                         as: 'directorList',
                         include: [
                            {
                                model: Director,
                                as: 'directors',
                                include: [
                                {
                                    model: Person,
                                    as: 'person'
                                }
                            ]
                        }]

                    }]
                },
                docList: function(){
                    return [{
                         model: DocumentList,
                         as: 'docList',
                         include: [
                            {
                                through: {attributes: []},
                                model: Document,
                                as: 'documents'
                            }
                         ]

                    }]
                },
                iRegister: function(){
                    return [{
                        model: InterestsRegister,
                        as: 'iRegister',
                        include: [{
                            model: InterestsEntry,
                            as: 'entries',
                            through: {attributes: []},
                            include: [{
                                model: Person,
                                as: 'persons',
                                through: {attributes: []}
                            }, {
                                model: Document,
                                as: 'documents',
                                through: {attributes: []}
                            }]
                        }]
                    }]
                }
            },
            ordering: {
                full: function(){
                    return [
                        [{model: Holding, as: 'holdings'}, 'id', 'ASC'],
                        [{model: Holding, as: 'holdings'}, {model: Parcel, as: 'parcels'}, 'shareClass', 'ASC'],
                        [{model: Holding, as: 'holdings'}, {model: Person, as: 'holders'}, 'name', 'ASC'],
                        [{model: DirectorList, as: 'directors'}, {model: Director, as: 'directors'}, {model: Person, as: 'person'}, 'name', 'ASC'],
                    ]
                },
                directorList: function(){
                    return [
                        [{model: DirectorList, as: 'directorList'}, {model: Director, as: 'directors'}, {model: Person, as: 'person'}, 'name', 'ASC']
                    ]
                },
                holdings: function(){
                    return [
                        [{model: Holding, as: 'holdings'}, 'id', 'ASC'],
                        [{model: Holding, as: 'holdings'}, {model: Parcel, as: 'parcels'}, 'shareClass', 'ASC'],
                        [{model: Holding, as: 'holdings'}, {model: Person, as: 'holders'}, 'name', 'ASC']
                    ]
                },
                iRegister: function() {
                    return [[{model: InterestsRegister, as: 'iRegister'}, {model: InterestsEntry, as: 'entries'}, 'date', 'ASC']];
                }
            },

            populatePersonIds: function(persons, user_id){
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

            findPersonId: function(person, user_id){
                return AddressService.normalizeAddress(person.address)
                        .then(function(address){
                            return Person.find({where: person})
                        .then(function(p){
                            if(p){
                                return p.personId
                            }
                    })
                })
            },

            findOrCreatePersons: function(obj){
                // persons can be in:
                // obj.holdings.holders
                // obj.directors.persons
                // TODO, start with list of people from db, will be short, and find them in js
                obj = _.cloneDeep(obj);

                return Promise.each(obj.holdingList.holdings || [], function(holding){
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
                    if(obj.directorList && obj.directorList.directors && obj.directorList.directors.length){
                        return Promise.each(obj.directorList.directors || [], function(director){
                            return AddressService.normalizeAddress(director.person.address)
                                .then(function(address){
                                    director.person = _.merge({}, director.person, {address: address});
                                    return Person.findOrCreate({where: director.person, defaults: director.person})
                                    .spread(function(person){
                                        director.person = person;
                                    })
                                });
                         });
                    }
                    return null;
                })
                .then(function(r){
                    return obj;
                })
            },


            createDedup: function(args){
                sails.log.verbose('Deduplication persons')
                return CompanyState.findOrCreatePersons(args)
                    .then(function(args){
                        const shareClasses = _.flatten(_.map(args.holdings, 'parcels'));
                        return args;
                    })
                    .then(function(args){
                        args.directorList = args.directorList || {directors: []}
                        var state = CompanyState.build(args, {include: CompanyState.includes.full()
                                .concat(CompanyState.includes.docList())
                                .concat(CompanyState.includes.directorList())
                                .concat(CompanyState.includes.holdingList())
                            });
                        // TODO, document why this is needed
                        (state.get('holdingList').get('holdings') || []).map(function(h){
                            h.get('holders').map(function(h){
                                h.isNewRecord = false;
                                h._changed = {};
                            })
                        });
                        (state.get('directorList').get('directors') || []).map(function(d){
                            d.get('person').isNewRecord = false;
                            d._changed = {};
                        });
                        state._populated = true;
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
                return this.getHoldingList({include: [{
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
                        }]})
                    .then(function(holdingList) {
                        const holdings = holdingList.dataValues.holdings;
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
                return Promise.resolve(this.isNewRecord || this.dataValues.holdingList.dataValues.holdings ?
                                      this.dataValues.holdingList.dataValues.holdings :
                        this.getHoldingList({
                            include: [{
                                model: Holding,
                                as: 'holdings',
                                include: [{
                                    model: Parcel,
                                    as: 'parcels',
                                    through: {
                                        attributes: []
                                    }
                                }, {
                                    model: Person,
                                    as: 'holders',
                                    through: {
                                        attributes: []
                                    },
                                    include: [{
                                        model: Transaction,
                                        as: 'transaction',
                                    }]
                                }, {
                                    model: Transaction,
                                    as: 'transaction',
                                }]
                            }]})
)

                    .then(function(holdings) {
                        return _.sum(_.flatten(holdings.map(function(s) {
                            return s.parcels;
                        })), function(p) {
                            return p.amount;
                        });
                    })
            },
            totalUnallocatedShares: function() {
                return Promise.resolve(this.isNewRecord || this.dataValues.unallocatedParcels ? this.dataValues.unallocatedParcels : this.getUnallocatedParcels())
                    .then(function(parcels) {
                        return _.sum(parcels, function(p) {
                            return p.amount;
                        });
                    })
            },

            nonAssociativeFields: function(){
                return _.omit(_.pick.apply(_, [this.dataValues].concat(_.keys(CompanyState.attributes))), 'id');
            },

            buildNext: function(attr){
                sails.log.info('Building next company state');
                return this.populateIfNeeded()
                    .then(() => {
                        return CompanyState.build(_.merge({}, this.toJSON(), attr, {id: null}),
                            {include:
                                CompanyState.includes.fullNoJunctions()
                                .concat(CompanyState.includes.docList())
                                .concat(CompanyState.includes.directorList())
                                .concat(CompanyState.includes.iRegister())
                                .concat(CompanyState.includes.holdingList())
                            })
                    })
                    .then((next) => {
                        function setNew(obj){
                            (obj.$options.includeNames || []).map(name => {
                                if(!obj.dataValues[name]){
                                    return;
                                }
                                function set(obj){
                                    if(obj.dataValues.id){
                                        obj.isNewRecord = false;
                                        obj._changed = {};
                                    }
                                    setNew(obj);
                                }
                                if(Array.isArray(obj.dataValues[name])){
                                    obj.dataValues[name].map(set);
                                }
                                else{
                                    set(obj.dataValues[name])
                                }
                            })
                        }
                        setNew(next);
                        next._populated = true;
                        sails.log.verbose('Next company state build');
                        return next;
                    });
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
                newHoldings = newHoldings.slice();
                sails.log.verbose('Adding holdings to companystate')
                " For now, using name equivilency to match holders (and companyId) "
                " Match all holders in a holding, then an issue will increase the parcels on that holding "
                const holdings = this.dataValues.holdingList.dataValues.holdings;
                const matches = [];
                _.some(holdings, function(nextHolding, j){
                    var toRemove;
                    newHoldings.forEach(function(holdingToAdd, i){
                        if(((holdingToAdd.holdingId && nextHolding.holdingId === holdingToAdd.holdingId ) ||
                            (!holdingToAdd.holdingId && nextHolding.holdersMatch(holdingToAdd))) &&
                           (!parcelHint || nextHolding.parcelsMatch({parcels: parcelHint}))){
                            holdings[j] = nextHolding = nextHolding.buildNext();
                            if(subtractHoldings){
                                nextHolding.subtractParcels(holdingToAdd);
                            }
                            else{
                                nextHolding.combineParcels(holdingToAdd);
                            }
                            if(transaction){
                                nextHolding.dataValues.transaction = transaction;
                            }
                            matches.push(nextHolding);
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
                    throw new sails.config.exceptions.InvalidInverseOperation('Unknown holders to combine with');
                }
                this.dataValues.holdingList.dataValues.holdings = this.dataValues.holdingList.dataValues.holdings.concat(extraHoldings);
                // unaccounted for, alter unallocated shares
                return matches;
            },

            subtractHoldings: function(subtractHoldings, parcelHint, transaction){
                return this.combineHoldings(subtractHoldings, parcelHint, transaction, true);
            },

            mutateHolders: function(holding, newHolders, transaction){
                //these new holders may have new members or address changes or something
                newHolders = newHolders.slice()
                var existingHolders = [];
                var index = this.dataValues.holdingList.dataValues.holdings.indexOf(holding);
                this.dataValues.holdingList.dataValues.holdings[index] = holding = holding.buildNext();
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
                let personId, newPerson, state = this;
                return CompanyState.findPersonId(newHolder)
                    .then(function(id){
                        if(!id) return CompanyState.findPersonId(currentHolder);
                        return id
                    })
                    .then(function(id){
                        return Person.buildFull(_.merge(newHolder, {personId: id})).save()
                    })
                    .then(function(person){
                        newPerson = person;
                        if(transaction){
                            return newPerson.setTransaction(transaction)
                        }
                    })
                    .then(function(){
                        state.dataValues.holdingList.dataValues.holdings.map(function(holding, i){
                            var index = _.findIndex(holding.dataValues.holders, function(h, i){
                                return h.isEqual(currentHolder);
                            });
                            if(index > -1){
                                holding = holding.buildNext();
                                state.dataValues.holdingList.dataValues.holdings[i] = holding;
                                holding.dataValues.holders[index] = newPerson;
                            }
                        });
                       // console.log(newHolder, currentHolder)
                       // console.log(JSON.stringify(state.dataValues.holdingList.dataValues.holdings));
                        return state;
                    });
            },

            replaceDirector: function(currentDirector, newDirector, transaction){
                const directors = this.dataValues.directorList.dataValues.directors;
                var index = _.findIndex(directors, function(d, i){
                        return d.person.isEqual(currentDirector);
                });
                if(index > -1){
                    //directors[index].personId = null;
                    directors[index] = directors[index].buildNext();
                    directors[index].dataValues.person = directors[index].dataValues.person.replaceWith(newDirector);
                    if(transaction){
                        directors[index].person.dataValues.transaction = transaction
                    }
                }
                else{
                    throw new sails.config.exceptions.InvalidInverseOperation('Unknown director to replace');
                }
                return this;
            },

            getMatchingHolding: function(holding, options={}){
                return this.getMatchingHoldings(holding, options.ignoreCompanyNumber)[0];
            },

            getMatchingHoldings: function(holding,  options={}){
                return _.filter(this.dataValues.holdingList.dataValues.holdings, function(h){
                    return (holding.holdingId && holding.holdingId === h.holdingId  ||
                            h.holdersMatch({holders: holding.holders || []},  options.ignoreCompanyNumber)) &&
                        (!holding.parcels || h.parcelsMatch({parcels: holding.parcels}));
                });
            },

            getHoldingBy: function(data){
                return _.find(this.dataValues.holdingList.dataValues.holdings, function(holding){
                    return _.isMatch(holding.get(), data)
                });
            },

            getHolderBy: function(data){
                // probably has to collapse whole tree for this to work
                var result;
                 _.some(this.dataValues.holdingList.dataValues.holdings, function(holding){
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
                let parcelList = this.dataValues.unallocatedParcels || [];
                parcelList.push(result);
                parcelList = _.filter(parcelList, function(p){
                    return p.amount;
                });
                this.dataValues.unallocatedParcels = parcelList;
                return match;
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
            },

            fullPopulate: function() {
                // tested to be faster way to populate for model for get_info
                const cs = this;
                return Promise.join(
                        this.getHoldingList({
                            include: [{
                                model: Holding,
                                as: 'holdings',
                                include: [{
                                    model: Parcel,
                                    as: 'parcels',
                                    through: {
                                        attributes: []
                                    }
                                }, {
                                    model: Person,
                                    as: 'holders',
                                    through: {
                                        attributes: []
                                    },
                                    include: [{
                                        model: Transaction,
                                        as: 'transaction',
                                    }]
                                }, {
                                    model: Transaction,
                                    as: 'transaction',
                                }]
                            }],
                            order: [
                                ['id', 'ASC'],
                                [{
                                    model: Holding,
                                    as: 'holdings'
                                },{
                                    model: Person,
                                    as: 'holders'
                                }, 'name', 'ASC']
                            ]
                        }),
                        this.getUnallocatedParcels(),
                        this.getTransaction({
                            include: [{
                                model: Transaction,
                                as: 'childTransactions'
                            }]
                        }), cs.getDocList({
                            include: [{
                                model: Document,
                                as: 'documents',
                                through: {
                                    attributes: []
                                }
                            }],
                            order: [
                                [{
                                    model: Document,
                                    as: 'documents'
                                }, 'date', 'DESC']
                            ],
                        }),
                        cs.getDirectorList({
                            include: [{
                                model: Director,
                                as: 'directors',
                                through: {attributes: []},
                                include: [{
                                    model: Person,
                                    as: 'person'
                                }]
                            }],
                            order: [
                                [{
                                    model: Director,
                                    as: 'directors'
                                },{
                                    model: Person,
                                    as: 'person'
                                }, 'name', 'ASC']
                            ]
                        }),
                        cs.getShareClasses({
                            include: [{
                                model: ShareClass,
                                as: 'shareClasses'
                            }]
                        }))
                    .spread(function(holdingList, unallocatedParcels, transaction, docList, directors, shareClasses) {
                        cs.holdingList = cs.dataValues.holdingList = holdingList;
                        cs.unallocatedParcels = cs.dataValues.unallocatedParcels = unallocatedParcels;
                        cs.transaction = cs.dataValues.transaction = transaction
                        cs.docList = cs.dataValues.docList = docList;
                        cs.directorList = cs.dataValues.directorList = directors;
                        cs.shareClasses = cs.dataValues.shareClasses = shareClasses;
                        cs._populated = true;
                        return cs;
                    })
            },
            populateIfNeeded: function(){
                if(this._populated){
                    return Promise.resolve(this)
                }
                else{
                    return this.fullPopulate();
                }
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