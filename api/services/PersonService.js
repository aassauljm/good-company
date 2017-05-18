const Promise = require('bluebird');


export function findOrCreateHistoric(userId, args) {
    const where = Object.keys(args.where).map(k => `"${k}" = :${k}`).join(' and ');

    return sequelize.query(`select * from historic_user_persons(:id) where ${where}`,
                   { type: sequelize.QueryTypes.SELECT,
                    replacements: {id: userId, ...args.where}})
        .then(result => {
            if(result.length){
                const person = Person.build(result[0]);
                person.isNewRecord = false;
                person._changed = {};
                return person;
            }
            else{
                return Person.create({...args.defaults, ownerId: userId, createdById: userId});
            }
        });
}


export function findOneHistoric(userId, args) {
    const where = Object.keys(args.where).map(k => `"${k}" = :${k}`).join(' and ');
    return sequelize.query(`select * from historic_user_persons(:id) where ${where}`,
                   { type: sequelize.QueryTypes.SELECT,
                    replacements: {id: userId, ...args.where}})
        .then(result => {
            if(result.length){
                const person = Person.build(result[0]);
                person.isNewRecord = false;
                person._changed = {};
                return person;
            }
        });
}



export function findOrCreate(userId, args) {
    const where = {...args.where};
    if(where.name){
        where.name = { $like: where.name }
    }
    return Person.findOrCreate({where: {...where, ownerId: userId}, defaults: {...args.defaults, ownerId: userId, createdById: userId}})
        .spread(p => p)
        .then(x => {
            return x;
        });
}


export function findOne(userId, args) {
    return Person.findOne({where: {...args.where, ownerId: userId}});
}


export function create(userId, args) {
    return Person.create({...args, ownerId: userId, createdById: userId});
}

export function buildFull(userId, args) {
    return Person.buildFull({...args, ownerId: userId, createdById: userId});
}