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
    Role.findOrCreate({ where: { name: 'organisationMember' }, defaults:  { name: 'organisationMember' }}),
    Role.findOrCreate({ where: { name: 'nonsubscribed' }, defaults: { name: 'nonsubscribed' }}),
    Role.findOrCreate({ where: { name: 'public' }, defaults: { name: 'public' }}),
    Role.findOrCreate({ where: { name: 'organisationAdmin' }, defaults: { name: 'organisationAdmin' }})
  ]).spread(function(){
    return _.map(arguments, function(r) { return r[0];});
  })
};
