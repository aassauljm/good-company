/**
 * Create admin user.
 * @param adminRole - the admin role which grants all permissions
 */
exports.create = function (roles, userModel) {
  return User.findOne({ username: sails.config.permissions.adminUsername })
    .then(function (user) {
      if (user) return user;

      sails.log.info('sails-permissions: admin user does not exist; creating...');
      return User.register({
        username: sails.config.permissions.adminUsername,
        password: sails.config.permissions.adminPassword,
        email: sails.config.permissions.adminEmail,
        roles:  [_.find(roles, { name: 'admin' })],
        createdBy: 1,
        owner: 1,
        model: userModel.id
      })
  });
};
