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
    InvalidOperation: errorFactory('InvalidOperation'),
    InvalidHoldingOperation: errorFactory('InvalidHolding'),
    CompanyImportException: errorFactory('CompanyImportException'),
    NameExistsException: errorFactory('NameExistsException')
}, require('sequelize/lib/errors'));


