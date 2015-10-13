var _ = require('lodash');

module.exports = {
  /**
   * Return the type of model acted upon by this request.
   */
  getTargetModelName: function (req) {
    if (_.isString(req.options.model)) {
      return req.options.model;
    } else {
        return req.model && req.model.name;
    }
  }
};
