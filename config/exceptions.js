var errorFactory = require('error-factory');
var _ = require('lodash');

module.exports.exceptions = _.defaults({
    ValidationException: errorFactory('ValidationException'),
    BadImmutableOperation: errorFactory('BadImmutableOperation'),
    ForbiddenException: errorFactory('ForbiddenException'),
    UserNotFoundException: errorFactory('UserNotFoundException'),
    BadCredentialsException: errorFactory('BadCredentialsException'),
    BadParcelOperation: errorFactory('BadParcelOperation'),
    TransactionNotFound: errorFactory('TransactionNotFound'),
    InvalidInverseOperation: errorFactory('InvalidInverseOperation'),
    InvalidHoldingOperation: errorFactory('InvalidHolding'),
    CompanyImportException: errorFactory('CompanyImportException')
}, require('sequelize/lib/errors'));


