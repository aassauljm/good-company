var Promise = require('bluebird');
/**
 * Creates default Roles
 *
 * @public
 */
exports.create = function () {
  return Promise.all([
    Role.findOrCreate({ where: { name: 'admin' }, defaults: { name: 'admin' }}),
    Role.findOrCreate({ where: { name: 'registered' }, defaults:  { name: 'registered' }}),
    Role.findOrCreate({ where: { name: 'public' }, defaults: { name: 'public' }})
  ]).spread(function(){
    return _.map(arguments, function(r) { return r[0];});
  })
};
