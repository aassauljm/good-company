/**
 * Company.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
    _config: {
        actions: false,
        shortcuts: false,
        rest: false
    },
    attributes: {
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
            type: 'string'
        },
        fraReportingMonth:{
            type: 'string'
        },
        ultimateHoldingCompany: {
            type: 'boolean'
        }
    }
};