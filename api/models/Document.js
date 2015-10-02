/**
* Document.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {
      _config: {
        actions: false,
        shortcuts: false,
        rest: true
      },
    attributes: {
        filename: {
            type: 'string',
            required: true,
        },
        owner: {
            model: 'user'
        },
        type: {
            type: 'string'
        },
        createdBy: {
            model: 'user'
        },
        documentData: {
            model: 'documentData'
        },
        directory: {
            model: 'documentDirectory'
        }
    },
    toJSON: function() {
        var obj = this.toObject();
        delete obj.data;
        return obj;
    },
};
