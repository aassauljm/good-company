var assert = require('assert');

describe('Permission Service', function() {

    it('should exist', function() {

        assert.ok(sails.services.permissionservice);
        assert.ok(global.PermissionService);

    });

    after(function(){
        //reset
        return Permission.destroy({where: {}})
            .then(function () {
                return sails.hooks['sails-permissions'].initializeFixtures(sails);
            });
    });

})