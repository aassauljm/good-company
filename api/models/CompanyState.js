/**
 * CompanyState.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */
var _ = require('lodash');
var Promise = require('bluebird');
var moment = require('moment');
var months = Sequelize.ENUM('January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December');


function removeUndefinedValues(obj){
    return Object.keys(obj).reduce((acc, k) => {
        if(obj[k]){
            acc[k] = obj[k];
        }
        return acc;
    }, {})
}

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
        constitutionFiled: {
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
        },
        extensive: {
            type: Sequelize.BOOLEAN
        },
        "contactFields": {
            type: Sequelize.JSON
        },
        "reportingFields": {
            type: Sequelize.JSON
        },
        "warnings": {
            type: Sequelize.JSONB
        },
        "coVersion": {
            type: Sequelize.TEXT
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
        CompanyState.belongsTo(Action, {
            as: 'historicActions',
            foreignKey: {
                as: 'historicActions',
                name: 'historic_action_id'
            }
        });
        CompanyState.belongsTo(Action, {
            as: 'pendingHistoricActions',
            foreignKey: {
                as: 'pendingHistoricActions',
                name: 'pending_historic_action_id'
            }
        });
        CompanyState.belongsTo(Action, {
            as: 'pendingFutureActions',
            foreignKey: {
                as: 'pendingFutureActions',
                name: 'pending_future_action_id'
            }
        });
        CompanyState.belongsTo(HistoricPersonList, {
            as: 'historicPersonList',
            foreignKey: {
                as: 'historicPersonList',
                name: 'h_person_list_id'
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
                        include: CompanyState.includes.holdings()
                    }]
                },
                holdings: function(){
                    return [{
                            model: Holding,
                            as: 'holdings',
                            include: [{
                                model: Parcel,
                                as: 'parcels',
                                through: {attributes: []}
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
                            },{
                                model: Transaction,
                                as: 'transaction',
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
                shareClasses: function(){
                    return [{
                        model: ShareClasses,
                        as: 'shareClasses',
                        include: [{
                            model: ShareClass,
                            as: 'shareClasses'
                        }]
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
                        [{model: Holding, as: 'holdings'}, {model: Holders, as: 'holders'}, {model: Person, as: 'person'}, 'name', 'ASC'],
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
                        [{model: Holding, as: 'holdings'}, {model: Holders, as: 'holders'}, {model: Person, as: 'person'}, 'name', 'ASC']
                    ]
                },
                iRegister: function() {
                    return [[{model: InterestsRegister, as: 'iRegister'}, {model: InterestsEntry, as: 'entries'}, 'date', 'ASC']];
                }
            },

            populatePersonIds: function(persons, userId){
                // TODO, collaspse, subset of graph
                persons = _.cloneDeep(persons)
                return Promise.map(persons || [], function(person){
                    return AddressService.normalizeAddress(person.address)
                        .then(function(address){
                            person.address = address;
                            person.ownerId = userId;
                            person.createdById = userId;
                            return PersonService.findOne(userId, {where: person})
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

            findPersonId: function(person, userId){
                if(person.personId){
                    return Promise.resolve(person.personId)
                }
                return AddressService.normalizeAddress(person.address)
                        .then(function(address){
                            // TODO, no, collapse this graph

                            return PersonService.findOne(userId, {where: removeUndefinedValues(person)})
                        })
                        .then(function(p){
                            if(p){
                                return p.personId
                            }
                    })

            },
            findOrCreatePerson: function(person, userId){
                return AddressService.normalizeAddress(person.address)
                        .then(function(address){
                            person = _.merge({}, person, {address: address, ownerId: userId, createdById: userId})
                            // this is unique, so any match is jackpot
                            if(person.companyNumber){
                                return PersonService.findOne(userId, {where: {companyNumber: person.companyNumber}})
                                    .then(p => {
                                        if(p){
                                            person.personId = p.personId;
                                        }
                                    })
                            }
                        })
                        .then(() => {
                            return PersonService.findOrCreate(userId, {where: person, defaults: person})
                                .then(function(person){
                                    return person;
                                });
                            })
            },
            findOrCreatePersons: function(obj, userId){
                // persons can be in:
                // obj.holdings.holders.person
                // obj.directors.persons
                // TODO, start with list of people from db, will be short, and find them in js
                obj = _.cloneDeep(obj);
                // if people have the same name in company, then damn it, give them same address
                /*if(obj.directorList && obj.directorList.directors && obj.directorList.directors.length){
                    const names = {};
                    (obj.holdingList.holdings || []).map(holding => {
                        (holding.holders || []).map(h => {
                            names[h.person.name] = [...(names[h.person.name] || []), h.person];
                        })
                    });
                    (obj.directorList.directors).map(d => {
                        (names[d.person.name] || []).map(p => {
                            p.address = d.person.address;
                        })
                    });
                }*/

                return Promise.each(obj.holdingList.holdings || [], function(holding){
                    return Promise.map(holding.holders || [], function(holder){
                        return AddressService.normalizeAddress(holder.person.address)
                            .then(function(address){
                                holder.person = _.merge({}, holder.person, {address: address});
                                return PersonService.findOrCreate(userId, {where: holder.person, defaults: holder.person})
                                    .then(function(person){
                                        holder.person = person;
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
                                    return PersonService.findOrCreate(userId, {where: director.person, defaults: director.person})
                                    .then(function(person){
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


            createDedup: function(args, userId){
                sails.log.verbose('Deduplication persons')
                return CompanyState.findOrCreatePersons(args, userId)
                    .then(function(_args){
                        args = _args;
                        const shareClasses = _.flatten(_.map(args.holdings, 'parcels'));
                        return Promise.all([Document.create({
                            type: 'Directory',
                            filename: 'Companies Office Documents',
                            ownerId: userId,
                            createdById: userId
                        })])
                    })
                    .spread(function(documentDirectory){
                        args.directorList = args.directorList || {directors: []}
                        args.transaction = args.transaction || {type: Transaction.types.SEED};
                        if(!args.docList){
                            args.docList = {documents: []}
                        }
                        let state = CompanyState.build(args, {
                            include: CompanyState.includes.full()
                                .concat(CompanyState.includes.docList())
                                .concat(CompanyState.includes.directorList())
                                .concat(CompanyState.includes.holdingList())
                            });

                        state.get('docList').get('documents').map(d => {
                            d.dataValues.directoryId = documentDirectory.dataValues.id;
                        })

                        state.get('docList').get('documents').push(documentDirectory);

                        (state.get('holdingList').get('holdings') || []).map(function(h){
                            h.get('holders').map(function(h){
                                h.get('person').isNewRecord = false;
                                h.get('person')._changed = {};
                            })
                        });
                        (state.get('directorList').get('directors') || []).map(function(d){
                            d.get('person').isNewRecord = false;
                            d.get('person')._changed = {};
                            d._changed = {};
                        });
                        state._populated = true;
                        return state.save();
                    })
                    .then(x => {
                        return x;
                    })
            }
        },
        instanceMethods: {
            getDocumentDirectory: function(){
                return Promise.resolve()
                .then(() =>{
                    if(this.docList && this.docList.documents){
                        return this.docList;
                    }
                    return this.getDocList({
                                include: [{
                                    model: Document,
                                    as: 'documents',
                                    through: {
                                        attributes: []
                                    }
                                }]})
                })
                .then(docList => {
                    return docList.documents.find(d => d.type === 'Directory' && d.filename === 'Companies Office Documents');
                });
            },

            getTransactionSummary: function(){
                return sequelize.query('select transaction_summary(:id)',
                                       { type: sequelize.QueryTypes.SELECT,
                                            replacements: { id: this.id}});
            },

            votingShareholdersCheck: function() {
                return this.getHoldingList({include: CompanyState.includes.holdings()})
                    .then(function(holdingList) {
                        if(!holdingList){
                            return;
                        }
                        const holdings = holdingList.dataValues.holdings;
                        return !holdings.every(h => {
                            return h.dataValues.holders.reduce((acc, p) => {
                                return acc + ((p.dataValues.data || {}).votingShareholder ? 1 : 0);
                            }, 0) === 1 || h.dataValues.holders.length === 1;
                        });
                    })
            },
            groupShares: function() {
                const holdingList = this.dataValues.holdingList;
                //return (holdingList ? Promise.resolve(holdingList) : this.getHoldingList({include: CompanyState.includes.holdings()}))
                return this.getHoldingList({include: CompanyState.includes.holdings()})
                    .then(function(holdingList) {
                    const holdings = holdingList ? holdingList.dataValues.holdings : [];
                    return _.groupBy(_.flatten(holdings.map(function(s) {
                        return s.parcels;
                    })), function(p) {
                        return p.shareClass;
                    });
                })
            },
            groupTotals: function() {
                // seems overly complicated
                return this.groupShares()
                    .then(function(groups) {
                        return Promise.reduce(_.values(groups), function(acc, shares) {
                            let result = _.reduce(shares, function(total, share) {
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
                return Promise.resolve(this.isNewRecord || this.dataValues.holdingList
                                       && this.dataValues.holdingList.dataValues.holdings ?
                                      this.dataValues.holdingList.dataValues.holdings :
                        this.getHoldingList({include: CompanyState.includes.holdings()}))
                    .then(function(holdings) {
                        holdings = holdings || [];
                        return _.sum(_.flatten(holdings.map(function(s) {
                            return s.parcels;
                        })), function(p) {
                            return p.amount;
                        });
                    })
            },
            groupUnallocatedShares: function() {
                return Promise.resolve(this.isNewRecord || this.dataValues.unallocatedParcels ? this.dataValues.unallocatedParcels : this.getUnallocatedParcels())
                    .then(function(parcels) {
                        return _.reduce(parcels, function(acc, p) {
                            acc[p.shareClass] ={amount: p.amount}
                            return acc;
                        }, {});
                    })
            },

            nonAssociativeFields: function(){
                return _.omit(_.pick.apply(_, [this.dataValues].concat(_.keys(CompanyState.attributes))), 'id');
            },

            buildNext: function(attr, options={}){
                sails.log.info('Building next company state');
                return this.populateIfNeeded()
                    .then(() => {
                        return CompanyState.build(_.merge({}, this.toJSON(), attr, {id: null, coVersion: null}),
                            {include:
                                CompanyState.includes.fullNoJunctions()
                                    .concat(CompanyState.includes.docList())
                                    .concat(CompanyState.includes.directorList())
                                    .concat(CompanyState.includes.iRegister())
                                    .concat(CompanyState.includes.holdingList())
                                    .concat(CompanyState.includes.shareClasses())
                            });
                    })
                    .then((next) => {
                        function setNew(obj){
                            (obj.$options.includeNames || []).map(name => {
                                if(!obj.dataValues[name]){
                                    return;
                                }
                                function set(obj){
                                    setNew(obj);
                                    if((!options.newRecords || obj.IMMUTABLE) && obj.dataValues.id){
                                        obj.isNewRecord = false;
                                        obj._changed = {};
                                    }
                                    else if(options.newRecords && !obj.IMMUTABLE){
                                        delete obj.dataValues.id;
                                    }
                                }
                                if(obj.$options.includeMap[name]._pseudo){
                                     delete obj.dataValues[name];
                                }
                                else if(Array.isArray(obj.dataValues[name])){
                                    obj.dataValues[name].map(set);
                                }
                                else{
                                    set(obj.dataValues[name]);
                                }
                            })
                        }
                        setNew(next);
                        next._populated = true;
                        sails.log.verbose('Next company state build');
                        return next;
                    });
            },


            buildPrevious: function(attr, options){
                return this.buildNext(attr, options)
                    .then(function(state){
                        state.dataValues.previousCompanyStateId = null;
                        return state;
                    })
            },

            createPrevious: function(attr){
                let self = this, prev;
                return this.buildPrevious(_.merge(attr, {transactionId: null, transaction: null}))
                    .then(function(_prev){
                        prev = _prev;
                        return prev.save();
                    })
                    .then(function(prev){
                        self.setPreviousCompanyState(prev);
                        return self.save();
                    })
                    .then(() => prev)
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
                    let toRemove;
                    newHoldings.forEach(function(holdingToAdd, i){
                        if(((holdingToAdd.holdingId && nextHolding.holdingId === holdingToAdd.holdingId ) ||
                            (!holdingToAdd.holdingId && nextHolding.holdersMatch(holdingToAdd, {ignoreCompanyNumber: true}))) &&
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
                let extraHoldings = newHoldings.map(function(holdingToAdd, i){
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

            mutateHolders: function(holding, newHolders, transaction, userId){
                //these new holders may have new members or address changes or something
                // TODO, rewrite, hard to follow
                const holdingList = this.dataValues.holdingList;
                return Promise.map(newHolders, (h) => CompanyState.findOrCreatePerson(h, userId), {concurrency: 1})
                .then(function(newHolders){
                    const existingHolders = [];
                    const index = holdingList.dataValues.holdings.indexOf(holding);
                    holdingList.dataValues.holdings[index] = holding = holding.buildNext();
                    _.some(holding.dataValues.holders, function(holder){
                        let toRemove;
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
                            // return early
                            return true;
                        }
                    });
                    holding.dataValues.holders = existingHolders.concat(newHolders.map(h => Holder.buildFull({person: h})));
                    if(transaction){
                        holding.dataValues.transaction = transaction;
                    }
                })
            },

            findPersonId: function(person){
                if(person.personId){
                    Promise.resolve(person.personId)
                }
                // look in holders/directors for a single name match, based ONLY on name
                const matches = [];
                this.dataValues.holdingList.holdings.map(h => {
                    h.dataValues.holders.map(h => {
                        if(h.person.name === person.name){
                            matches.push(h.person.personId)
                        }
                    });
                })
                this.dataValues.directorList.directors.map(h => {
                    if(h.person.name === person.name){
                        matches.push(h.person.personId)
                    }
                })

                if(_.unique(matches).length === 1){
                    return Promise.resolve(matches[0]);
                }
                return Promise.resolve(undefined)
            },
            replaceHolder: function(currentHolder, newHolder, transaction, userId){
                let personId, newPerson, state = this;
                return this.findPersonId(newHolder)
                    .then(function(id){
                        if(!id) return CompanyState.findPersonId(newHolder, userId);
                        return id;
                    })
                    .then(function(id){
                        if(!id) return CompanyState.findPersonId(currentHolder, userId);
                        return id
                    })
                    .then(function(id){
                        return PersonService.buildFull(userId, _.merge(newHolder, {personId: id})).save()
                    })
                    .then(function(person){
                        newPerson = person;
                        if(transaction){
                            return newPerson.setTransaction(transaction)
                        }
                    })
                    .then(function(){
                        return Promise.reduce(state.dataValues.holdingList.dataValues.holdings, function(replaced, holding, j){
                            const index = _.findIndex(holding.dataValues.holders, function(h, i){
                                return h.isEqual(currentHolder);
                            });
                            if(index > -1){
                                holding = holding.buildNext()
                                state.dataValues.holdingList.holdings[j] = state.dataValues.holdingList.dataValues.holdings[j] = holding;
                                const holder = holding.dataValues.holders[index].buildNext();
                                holder.person = holder.dataValues.person = newPerson;
                                holding.holders[index] = holding.dataValues.holders[index] = holder;
                                sails.log.debug('Replaced holder: ' + JSON.stringify(holder.toJSON()))
                                return true;
                            }
                            return replaced;
                        }, false);
                    })
                    .then(replaced => {
                        if(!replaced){
                            throw new sails.config.exceptions.InvalidOperation('Unknown holder to replace');
                        }
                        return state;
                    });
            },

            replaceDirector: function(currentDirector, newDirector, transaction, userId){
                const directors = this.dataValues.directorList.dataValues.directors;
                let newPerson, state = this;
                return this.findPersonId(newDirector)
                    .then(function(id){
                        if(!id) return CompanyState.findPersonId(newDirector, userId)
                        return id;
                    })
                    .then(function(personId){
                        if(!personId) return CompanyState.findPersonId(currentDirector, userId);
                        return personId
                    })
                    .then(function(personId){
                        return PersonService.buildFull(userId, _.merge(newDirector, {personId: personId})).save()
                    })
                    .then(function(person){
                        newPerson = person;
                        if(transaction){
                            return newPerson.setTransaction(transaction)
                        }
                    })
                    .then(function(){
                        let index = _.findIndex(directors, function(d, i){
                                return d.dataValues.person.isEqual(currentDirector);
                        });
                        // TODO, think of better way
                        if(index < 0){
                            index = _.findIndex(directors, function(d, i){
                                return d.dataValues.person.isEqual(currentDirector, {skipAddress: true});
                            });
                        }

                        if(index > -1){
                            directors[index] = directors[index].buildNext();
                            directors[index].dataValues.person = directors[index].dataValues.person.replaceWith(newPerson);
                            if(transaction){
                                directors[index].person.dataValues.transaction = transaction
                            }
                        }
                        else{
                            throw new sails.config.exceptions.InvalidOperation('Unknown director to replace');
                        }
                        return state;
                    })
            },


            mergePersons: function(source, targets) {
                /* This function sets the personId of all matching targets equal to the source personId */
                let state;
                return this.buildNext()
                    .then(_state => {
                        state = _state;
                        return state.dataValues.holdingList.buildNext();
                    })
                    .then((holdingList) => {
                        state.holdingList = state.dataValues.holdingList = holdingList;
                        state.dataValues.h_list_id = null;
                        return holdingList.dataValues.holdings.map((h, j) => {
                            const holding = holdingList.dataValues.holdings[j];
                            return targets.map(target => {
                                let found = false;
                                return holding.dataValues.holders.map((h, i) => {
                                    if(h.isEqual(source)){
                                        found = true;
                                    }
                                    if(h.isEqual(target)){
                                        if(found){
                                            throw Error('Cannot have two identical holders in same holding')
                                        }
                                        found = true;
                                        const newHolding = holding.buildNext();
                                        holdingList.holdings[j] = holdingList.dataValues.holdings[j] = newHolding;
                                        const holder = newHolding.dataValues.holders[i].buildNext(true);
                                        holder.person.personId = source.personId;
                                        newHolding.holders[i] = newHolding.dataValues.holders[i] = holder;
                                    }
                                })

                            })
                        })
                    })
                    .then(() => {
                        return state.dataValues.directorList.buildNext()
                    })
                    .then(directorList => {
                        state.directorList = state.dataValues.directorList = directorList;
                        state.dataValues.director_list_id = null;
                        let found = false;
                        return targets.map(target => {
                            return directorList.dataValues.directors.map((d, j) => {
                                const director = directorList.dataValues.directors[j];
                                if(d.isEqual(source)){
                                    found = true;
                                }
                                if(d.isEqual(target)){
                                    if(found){
                                        throw Error('Cannot have two identical directors')
                                    }
                                    found = true;
                                    const newDirector = director.buildNext(true);
                                    directorList.dataValues.directors[j] = newDirector;
                                    newDirector.person.personId = source.personId;
                                }
                            })
                        })
                    })
                    .then(() => {
                        return state;
                    })
            },

            getMatchingHolding: function(holding, options={}){
                return this.getMatchingHoldings(holding, options)[0];
            },

            getMatchingHoldings: function(holding,  options={}){
                return _.filter(this.dataValues.holdingList.dataValues.holdings, function(h){
                    if(holding.holdingId){
                        return holding.holdingId === h.holdingId
                    }
                    return h.holdersMatch({holders: holding.holders || []},  options.ignoreCompanyNumber) &&
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
                let result;
                 _.some(this.dataValues.holdingList.dataValues.holdings, function(holding){
                    return _.some(holding.dataValues.holders, function(holder){
                        if(holder.person.isEqual(data)){
                            result = holder;
                            return result;
                        }
                    });
                });
                return result;
            },
            getHoldersBy: function(data){
                // probably has to collapse whole tree for this to work
                let results = [];
                 _.map(this.dataValues.holdingList.dataValues.holdings, function(holding){
                    return _.map(holding.dataValues.holders, function(holder){
                        if(holder.person.isEqual(data)){
                            results.push(holder);
                        }
                    });
                });
                return results;
            },

            getDirectorBy: function(data){
                // probably has to collapse whole tree for this to work
                let result;
                 _.some(this.dataValues.directorList.dataValues.directors, function(director){
                    if(director.person.isEqual(data)){
                        result = director;
                        return result;
                    }
                });
                return result;
            },
            combineUnallocatedParcels: function(parcel, subtract){
                let match, result;
                parcel = Parcel.build(parcel);
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

            hasEmptyHoldings: function(){
                return this.dataValues.holdingList && this.dataValues.holdingList.dataValues.holdings.some(h => h.hasEmptyParcels());
            },

            stats: function(combineUnallocated){
                let stats = {};

                return Promise.join(this.totalAllocatedShares(),
                                    this.groupUnallocatedShares(),
                                    this.groupTotals(),
                                    this.getTransactionSummary(),
                                    this.getUnallocatedParcels(),
                        function(total,
                                 unallocated,
                                countByClass,
                                transactionSummary,
                                unallocatedParcels,
                                ){
                        stats.totalUnallocatedShares = _.sum(Object.keys(unallocated).map(k =>  unallocated[k]), 'amount');
                        stats.totalAllocatedShares = total;
                        stats.shareCountByClass = countByClass;
                        if(combineUnallocated){
                            Object.keys(unallocated).map(k => {
                                stats.shareCountByClass[k] = stats.shareCountByClass[k] || {amount: 0}
                                stats.shareCountByClass[k].amount += unallocated[k].amount;
                            })
                        }
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
                            }],
                            order: [
                                ['id', 'ASC'],
                                [{
                                    model: Holding,
                                    as: 'holdings'
                                },{
                                    model: Holder,
                                    as: 'holders'
                                },{
                                    model: Person,
                                    as: 'person'
                                }, 'name', 'ASC'],
                                [{
                                    model: Holding,
                                    as: 'holdings'
                                },{
                                    model: Parcel,
                                    as: 'parcels'
                                }, 'amount', 'DESC']
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
                                as: 'shareClasses',
                                include: [{
                                    model: Document,
                                    as: 'documents',
                                    through: {
                                        attributes: []
                                    }
                                }],
                                through: {
                                    attributes: []
                                }
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

            populateIfNeeded: function(force){
                if(this._populated && !force){
                    return Promise.resolve(this)
                }
                else{
                    return this.fullPopulate();
                }
            },

            fullPopulateJSON: function(force){
                return this.populateIfNeeded()
                .then(() => this.stats())
                .then((stats) => ({...this.toJSON(), ...stats}))
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
            },
            /*afterCreate: function(companyState,  options){
                return sequelize.query("select update_warnings(:id, :generation)",
                           { type: sequelize.QueryTypes.SELECT,
                            replacements: { id: this.currentCompanyStateId}})
            }*/

        }
    }
};