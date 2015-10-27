var _ = require('lodash')

function ValidationException(value) {
   this.value = value;
   this.toString = function() {
      return this.value + this.message;
   };
}

ValidationException.prototype = Object.create(Error.prototype);
ValidationException.prototype.constructor = ValidationException

function BadImmutableOperation(value) {
   this.value = value;
   this.toString = function() {
      return this.value + this.message;
   };
}

BadImmutableOperation.prototype = Object.create(Error.prototype);
BadImmutableOperation.prototype.constructor = BadImmutableOperation;

function ForbiddenException(value) {
   this.value = value;
   this.toString = function() {
      return this.value + this.message;
   };
}

ForbiddenException.prototype = Object.create(Error.prototype);
ForbiddenException.prototype.constructor = ForbiddenException

function UserNotFoundException(value) {
   this.value = value;
   this.toString = function() {
      return this.value + this.message;
   };
}

UserNotFoundException.prototype = Object.create(Error.prototype);
UserNotFoundException.prototype.constructor = UserNotFoundException;

function BadCredentialsException(value) {
   this.value = value;
   this.toString = function() {
      return this.value + this.message;
   };
}

BadCredentialsException.prototype = Object.create(Error.prototype);
BadCredentialsException.prototype.constructor = BadCredentialsException;

function BadParcelOperation(value) {
   this.value = value;
   this.toString = function() {
      return this.value + this.message;
   };
}

BadParcelOperation.prototype = Object.create(Error.prototype);
BadParcelOperation.prototype.constructor = BadParcelOperation;

function TransactionException(value) {
   this.value = value;
   this.toString = function() {
      return this.value + this.message;
   };
}

TransactionException.prototype = Object.create(Error.prototype);
TransactionException.prototype.constructor = TransactionException;

function TransactionNotFound(value) {
   this.value = value;
   this.toString = function() {
      return this.value + this.message;
   };
}

TransactionNotFound.prototype = Object.create(Error.prototype);
TransactionNotFound.prototype.constructor = TransactionNotFound;


module.exports.exceptions = _.defaults({
    ValidationException: ValidationException,
    BadImmutableOperation: BadImmutableOperation,
    ForbiddenException: ForbiddenException,
    UserNotFoundException: UserNotFoundException,
    BadCredentialsException: BadCredentialsException,
    BadParcelOperation: BadParcelOperation,
    TransactionNotFound: TransactionNotFound
}, require('sequelize/lib/errors'));


