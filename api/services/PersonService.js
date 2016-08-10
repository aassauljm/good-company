const Promise = require('bluebird');


export function findOrCreate(userId, args) {
    //return sequelize.query("", {userId: userId})
    return Person.findOrCreate(args)
}


export function findOne(userId, args) {
    //return sequelize.query("", {userId: userId});
    return Person.findOne(args);
}



export function find(userId, args) {
    //return sequelize.query("", {userId: userId});
    return Person.find(args);
}