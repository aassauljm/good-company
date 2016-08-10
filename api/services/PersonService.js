const Promise = require('bluebird');


export function findOrCreate(userId, args) {
    //return sequelize.query("", {userId: userId});
    const where = Object.keys(args.where).map(k => `"${k}" = :${k}`).join(' and ');

    return sequelize.query(`select * from historic_user_persons(:id) where ${where}`,
                   { type: sequelize.QueryTypes.SELECT,
                    replacements: {id: userId, ...args.where}})
        .then(result => {
            console.log(result)
            if(result.length){
                const person = Person.build(result[0]);
                person.isNewRecord = false;
                person._changed = {};
                console.log('found or created', person.toJSON());
                return person;
            }
            else{
                console.log('didnt findorcreate', args.defaults, where);
                return Person.create(args.defaults);
            }
        });
}


export function findOne(userId, args) {
    const where = Object.keys(args.where).map(k => `"${k}" = :${k}`).join(' and ');
    console.log(where, {id: userId, ...args.where})
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


