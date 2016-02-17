/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 * An asynchronous bootstrap function that runs before your Sails app gets lifted.
 * This gives you an opportunity to set up your data model, run jobs, or perform some special logic.
 *
 * For more information on bootstrapping your app, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.bootstrap.html
 */

var getNamespace = require('continuation-local-storage').getNamespace;
//var patchBluebird = require('cls-bluebird');
var Promise = require('bluebird'),
    shimmer = require('shimmer');


// functionName: The Promise function that should be shimmed
// fnArgs: The arguments index that should be CLS enabled (typically all callbacks). Offset from last if negative

function patchBluebird(ns) {
    function shimCLS(object, functionName, fnArgs) {
        shimmer.wrap(object, functionName, function(fn) {
            return function() {
                for (var x = 0; x < fnArgs.length; x++) {
                    var argIndex = fnArgs[x] < 0 ? arguments.length + fnArgs[x] : fnArgs[x];
                    if (argIndex < arguments.length && typeof arguments[argIndex] === 'function') {
                        arguments[argIndex] = ns.bind(arguments[argIndex]);
                    }
                }
                return fn.apply(this, arguments);
            };
        });
    }

    // Core
    shimCLS(Promise, 'join', [-1]);
    shimCLS(Promise.prototype, 'then', [0, 1, 2]);
    shimCLS(Promise.prototype, 'spread', [0, 1]);
    shimCLS(Promise.prototype, 'catch', [-1]);
    shimCLS(Promise.prototype, 'error', [0]);
    shimCLS(Promise.prototype, 'finally', [0]);

    // Collections
    shimCLS(Promise, 'map', [1]);
    shimCLS(Promise, 'reduce', [1]);
    shimCLS(Promise, 'filter', [1]);
    shimCLS(Promise, 'each', [1]);
    shimCLS(Promise.prototype, 'map', [0]);
    shimCLS(Promise.prototype, 'reduce', [0]);
    shimCLS(Promise.prototype, 'filter', [0]);
    shimCLS(Promise.prototype, 'each', [0]);

    // Promisification
    shimCLS(Promise.prototype, 'nodeify', [0]);

    // Utility
    shimCLS(Promise.prototype, 'tap', [0]);

    // Error management configuration
    shimCLS(Promise.prototype, 'done', [0, 1]);

}


module.exports.bootstrap = function(cb) {
    sails.services.passport.loadStrategies();
    // It's very important to trigger this callback method when you are finished
    // with the bootstrap!  (otherwise your server will never lift, since it's waiting on the bootstrap)
    var namespace = getNamespace('sails-sequelize-postgresql');
    patchBluebird(namespace);
    cb();
};