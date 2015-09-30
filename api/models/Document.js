/**
* Document.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {
    attributes: {
        name: {
            type: 'string',
            required: true,
        },
        data: {
            type: 'binary',
            required: true
        },
        owner: {
            model: 'user'
        },
        createdBy: {
            model: 'user'
        }
    },
    toJSON: function() {
        var obj = this.toObject();
        delete obj.data;
        return obj;
    },
};
