
module.exports = function (sails) {
    return {
        identity: 'lodashExtenstions',

        initialize: function(next){
            _.mixin({
                omitDeep:  function omitDeep(object, predicate) {
                        predicate = [].splice.call(arguments, 0);
                        predicate.splice(0, 1);

                        if (predicate.length && _.isFunction(predicate[0])) {
                            predicate = predicate[0];
                        } else if (predicate.length) {
                            const props = _.flattenDeep(predicate);
                            predicate = function(key) {
                                return _.find(props, function(p) {
                                    return key === p;
                                });
                            };
                        } else {
                            return object;
                        }

                        _.forOwn(object, function(val, key) {
                            if (predicate(key, val)) {
                                delete object[key];
                            } else if (_.isObject(val)) {
                                object[key] = omitDeep(val, predicate);
                            }
                        });
                        return object;
                }
            });
            next();
        }
    }
}