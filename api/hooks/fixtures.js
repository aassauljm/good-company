
module.exports = function (sails) {
  return {
    initialize: function (next) {
      sails.log.info('Initializing fixtures');

      sails.after('hook:permissions:loaded', function () {
        return initializeFixtures(sails)
          .then(function () {
            next();
          });
      });
    }
  };
};

/**
 * Install the application. Sets up default Roles, Users, Models, and
 * Permissions, and creates an admin user.
 */
function initializeFixtures (sails) {
   return require('../../config/fixtures/permission').create();
}


