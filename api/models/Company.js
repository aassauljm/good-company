/**
 * Company.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */
var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];


module.exports = {
    attributes: {
        companyName: {
            type: 'string',
            required: true,
            notNull: true
        },
        companyNumber: {
            type: 'integer',
        },
        nzba: {
            type: 'integer',
        },
        incorporationDate: {
            type: 'date'
        },
        companyStatus: {
            type: 'string'
        },
        entityType: {
            type: 'string'
        },
        constiutionFiled: {
            type: 'boolean'
        },
        arFilingMonth: {
            type: 'string',
            enum: months
        },
        fraReportingMonth:{
            type: 'string',
            enum: months
        },
        registeredCompanyAddress: {
            type: 'string'
        },
        addressForShareRegister: {
            type: 'string'
        },
        addressForService: {
            type: 'string'
        },
        ultimateHoldingCompany: {
            type: 'boolean'
        },
        shareholdings: {
            collection: 'shareholding',
            via: 'company'
        }
    }
};