var Promise = require('bluebird');
/**
 * Creates database representations of the Model types.
 *
 * @public
 */
exports.createModels = function () {
  sails.log.verbose('sails-permissions: syncing waterline models');

  var models = _.compact(_.map(sails.controllers, function (controller, name) {
    var conf = controller._config
      , modelName = conf && conf.model && conf.model.name
      , model = sails.models[modelName || name]
    ;
    if(model)
    return model && model.name && model.tableName && {
      name: model.name,
      identity: model.tableName,
      attributes: _.omit(model.attributes, _.functions(model.attributes))
    };
  }));
  return Promise.map(models, function (model) {
    return Model.findOrCreate({where: { name: model.name }, defaults: model})
        .spread(function(model){ return model; });;
  });
};
