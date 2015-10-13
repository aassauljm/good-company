function ValidationException(value) {
   this.value = value;
   this.toString = function() {
      return this.value + this.message;
   };
}

ValidationException.prototype = Object.create(Error.prototype);
ValidationException.prototype.constructor = ValidationException


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

module.exports.exceptions = {
    ValidationException: ValidationException,
    ForbiddenException: ForbiddenException,
    UserNotFoundException: UserNotFoundException,
    BadCredentialsException: BadCredentialsException
}