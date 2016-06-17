var errorFactory = require('error-factory');
var _ = require('lodash');

module.exports.exceptions = _.defaults({
    ValidationException: errorFactory('ValidationException', [ 'message', 'context' ]),
    BadImmutableOperation: errorFactory('BadImmutableOperation', [ 'message', 'context' ]),
    ForbiddenException: errorFactory('ForbiddenException', [ 'message', 'context' ]),
    UserNotFoundException: errorFactory('UserNotFoundException', [ 'message', 'context' ]),
    BadCredentialsException: errorFactory('BadCredentialsException', [ 'message', 'context' ]),
    BadParcelOperation: errorFactory('BadParcelOperation', [ 'message', 'context' ]),
    TransactionNotFound: errorFactory('TransactionNotFound', [ 'message', 'context' ]),
    InvalidInverseOperation: errorFactory('InvalidInverseOperation', [ 'message', 'context' ]),
    InvalidIgnorableInverseOperation: errorFactory('InvalidIgnorableInverseOperation', [ 'message', 'context' ]),
    InvalidOperation: errorFactory('InvalidOperation', [ 'message', 'context' ]),
    InvalidHoldingOperation: errorFactory('InvalidHolding', [ 'message', 'context' ]),
    CompanyImportException: errorFactory('CompanyImportException', [ 'message', 'context' ]),
    NameExistsException: errorFactory('NameExistsException', [ 'message', 'context' ]),
    AmbiguousInverseOperation: errorFactory('AmbiguousInverseOperation', [ 'message', 'context' ])
}, require('sequelize/lib/errors'));


