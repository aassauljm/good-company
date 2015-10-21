
module.exports = function (sails) {
    return {
        identity: 'lodashExtenstions',

        initialize: function(next){
            _.mixin({
                omitDeep: function(obj, iteratee, context) {
                    var r = _.omit(obj, iteratee, context);

                    _.each(r, function(val, key) {
                        if (typeof(val) === "object")
                            r[key] = _.omitDeep(val, iteratee, context);
                    });

                    return r;
                }
            });
            next();
        }
    }
}