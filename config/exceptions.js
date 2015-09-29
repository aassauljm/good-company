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

module.exports.exceptions = {
    ValidationException: ValidationException,
    ForbiddenException: ForbiddenException
}