var assert = require('assert');
var Promise = require('bluebird');


describe('Permission Service', function() {
    describe('User based permissions', function(){
        before(function(){
            //reset
           return Promise.all([
                              User.create({username: 'first', email: 'e1@mail.com', passports: [{provider: 'catalex', 'identifier': '3'}] }, {include: [{model: Passport, as: 'passports'}]}),
                              User.create({username: 'second', email: 'e2@mail.com', passports: [{provider: 'catalex', 'identifier': '2'}] }, {include: [{model: Passport, as: 'passports'}]}),
                              User.create({username: 'third', email: 'e3@mail.com', passports: [{provider: 'catalex', 'identifier': '1'}] }, {include: [{model: Passport, as: 'passports'}]})
                              ])
            .spread((user1, user2, user3) => {
                this.user1 = user1;
                this.user2 = user2;
                this.user3 = user3;
                return Promise.all([
                                   Company.create({ownerId: this.user1.id, currentCompanyState: {companyName: 'test'}}, {include: [{model: CompanyState, as: 'currentCompanyState'}]}),
                                   Company.create({ownerId: this.user1.id, currentCompanyState: {companyName: 'test2'}}, {include: [{model: CompanyState, as: 'currentCompanyState'}]})
                                   ])
                .spread((c, c2) => {
                    this.company = c;
                    this.otherCompany =c2;
                });
            });
        });

        it('should exist', function() {

            assert.ok(sails.services.permissionservice);
            assert.ok(global.PermissionService);

        });

        it('should check read access from two users', function(){
            return PermissionService.isAllowed(this.company, this.user1, 'read', 'Company')
            .then(allowed => {
                allowed.should.be.true;
                return PermissionService.isAllowed(this.company, this.user1, 'update', 'Company')
            })
            .then(allowed => {
                allowed.should.be.true;
                return PermissionService.isAllowed(this.company, this.user2, 'read', 'Company')
            })
            .then(allowed => {
                allowed.should.be.false;
            });
        });

        it('should add read access to user, then revoke', function(){
            return PermissionService.addPermissionUser(this.user2, this.company, 'read', true)
            .then(allowed => {
                return PermissionService.isAllowed(this.company, this.user2, 'read', 'Company')
            })
            .then(allowed => {
                allowed.should.be.true;
                return PermissionService.isAllowed(this.company, this.user3, 'read', 'Company')
            })
            .then(allowed => {
                allowed.should.be.false
                return PermissionService.removePermissionUser(this.user2, this.company, 'read', true)
            })
            .then(() => {
                return PermissionService.isAllowed(this.company, this.user2, 'read', 'Company')
            })
            .then(allowed => {
                allowed.should.be.false;
            });
        });

        it('should add read access to catalex user, then revoke', function(){
            return PermissionService.addPermissionCatalexUser(this.user2.passports[0].identifier, this.company, 'read', true)

            .then(allowed => {
                return PermissionService.isAllowed(this.company, this.user2, 'read', 'Company')
            })
            .then(allowed => {
                allowed.should.be.true;
                return PermissionService.isAllowed(this.company, this.user3, 'read', 'Company')
            })
            .then(allowed => {
                allowed.should.be.false
                return PermissionService.removePermissionCatalexUser(this.user2.passports[0].identifier, this.company, 'read', true)
            })
            .then(() => {
                return PermissionService.isAllowed(this.company, this.user2, 'read', 'Company')
            })
            .then(allowed => {
                allowed.should.be.false;
            });
        });


        it('should get filtered company list', function(){
            return Company.getNowCompanies(this.user2.id)
                .then(companies => {
                    companies.length.should.equal(0);
                    return PermissionService.addPermissionCatalexUser(this.user2.passports[0].identifier, this.company, 'read', true);
                })
                .then(() => {
                     return Company.getNowCompanies(this.user2.id)
                 })
                .then((companies) => {
                    companies.length.should.be.equal(1);
                    return PermissionService.removePermissionCatalexUser(this.user2.passports[0].identifier, this.company, 'read', true)
                })
                .then(() => {
                     return Company.getNowCompanies(this.user2.id)
                 })
                .then(companies => {
                    companies.length.should.equal(0);
                });
        });

        after(function(){
            return Promise.all([this.user1.destroy(), this.user2.destroy(), this.user3.destroy(), Permission.destroy({where: {}})])
                .then(function () {
                    return sails.hooks['sails-permissions'].initializeFixtures(sails);
                });
        });

    });

    describe('Organisation permissions', function(){
        before(function(){
            //reset
           return Promise.all([
                              User.create({username: 'first', email: 'e1@mail.com', passports: [{provider: 'catalex', 'identifier': '3'}] }, {include: [{model: Passport, as: 'passports'}]}),
                              User.create({username: 'second', email: 'e2@mail.com', passports: [{provider: 'catalex', 'identifier': '2'}] }, {include: [{model: Passport, as: 'passports'}]}),
                              User.create({username: 'third', email: 'e3@mail.com', passports: [{provider: 'catalex', 'identifier': '1'}] }, {include: [{model: Passport, as: 'passports'}]})
                              ])
            .spread((user1, user2, user3) => {
                this.user1 = user1;
                this.user2 = user2;
                this.user3 = user3;
                return Promise.all([
                                   Company.create({ownerId: this.user1.id, currentCompanyState: {companyName: 'test'}}, {include: [{model: CompanyState, as: 'currentCompanyState'}]}),
                                   Company.create({ownerId: this.user1.id, currentCompanyState: {companyName: 'test2'}}, {include: [{model: CompanyState, as: 'currentCompanyState'}]})
                                   ])
                .spread((c, c2) => {
                    this.company = c;
                    this.otherCompany = c2;
                    return Organisation.updateOrganisation({
                        id: 1,
                        members: [{id: '3'}, {id: '2'}]
                   })
                });
            });
        });

        it('members of org should see company', function(){
            return Company.getNowCompanies(this.user1.id)
                .then((companies) => {
                    companies.length.should.be.equal(2);
                      return Company.getNowCompanies(this.user2.id);
                  })
                .then((companies) => {
                    companies.length.should.be.equal(2);
                      return Company.getNowCompanies(this.user3.id);
                  })
                .then((companies) => {
                    companies.length.should.be.equal(0);
                  })
        });

        it('should add deny read permission', function(){
           return PermissionService.addPermissionCatalexUser(this.user2.passports[0].identifier, this.company, 'read', false)
                .then(() => {
                      return Company.getNowCompanies(this.user2.id);
                  })
                .then((companies) => {
                    companies.length.should.be.equal(1);
                    return Company.getNowCompanies(this.user1.id);
                  })
                .then((companies) => {
                    companies.length.should.be.equal(2);
                    return PermissionService.removePermissionCatalexUser(this.user2.passports[0].identifier, this.company, 'read', false);
                  })
                .then(() => {
                      return Company.getNowCompanies(this.user2.id);
                  })
                .then((companies) => {
                    companies.length.should.be.equal(2);
                });
        });

        it('should add deny update permission', function(){
            return PermissionService.isAllowed(this.company, this.user2, 'update', 'Company')
                .then(allow => {
                    allow.should.be.equal(true);
                    return PermissionService.addPermissionCatalexUser(this.user2.passports[0].identifier, this.company, 'update', false)
                })
                .then(() => {
                    return PermissionService.isAllowed(this.company, this.user2, 'update', 'Company')
                })
                .then(allow => {
                    allow.should.be.equal(false);
                    return PermissionService.removePermissionCatalexUser(this.user2.passports[0].identifier, this.company, 'update',false)
                })
                .then(() => {
                    return PermissionService.isAllowed(this.company, this.user2, 'update', 'Company');
                })
                .then(allow => {
                    allow.should.be.equal(true);
                })

        });

        it('should get company user permissions', function(){
                return this.company.foreignPermissions()
                .then(permissions => {
                    permissions.length.should.be.equal(2);
                });
         });

        after(function(){
            return Promise.all([this.user1.destroy(), this.user2.destroy(), this.user3.destroy(), Permission.destroy({where: {}}), Organisation.destroy({where:{organisationId: 1}})])
                .then(function () {
                    return sails.hooks['sails-permissions'].initializeFixtures(sails);
                });
        });
    });


    describe('Multiple Organisation permissions', function(){
        before(function(){
            //reset
           return Promise.all([
                              User.create({username: 'first', email: 'e1@mail.com', passports: [{provider: 'catalex', 'identifier': '3'}] }, {include: [{model: Passport, as: 'passports'}]}),
                              User.create({username: 'second', email: 'e2@mail.com', passports: [{provider: 'catalex', 'identifier': '2'}] }, {include: [{model: Passport, as: 'passports'}]}),
                              User.create({username: 'third', email: 'e3@mail.com', passports: [{provider: 'catalex', 'identifier': '1'}] }, {include: [{model: Passport, as: 'passports'}]})
                              ])
            .spread((user1, user2, user3) => {
                this.user1 = user1;
                this.user2 = user2;
                this.user3 = user3;
                return Promise.all([
                                   Company.create({ownerId: this.user1.id, currentCompanyState: {companyName: 'test'}}, {include: [{model: CompanyState, as: 'currentCompanyState'}]}),
                                   Company.create({ownerId: this.user1.id, currentCompanyState: {companyName: 'test2'}}, {include: [{model: CompanyState, as: 'currentCompanyState'}]})
                                   ])
                .spread((c, c2) => {
                    this.company = c;
                    this.otherCompany = c2;
                    return Promise.all([Organisation.updateOrganisation({
                        id: 1,
                        members: [{id: '1'}, {id: '3'}]
                   }),Organisation.updateOrganisation({
                        id: 2,
                        members: [{id: '2'}]
                   })])
                });
            });
        });

        it('should fail to change permission of user in another org', function(){
           //return PermissionService.addPermissionCatalexUser(this.user2.passports[0].identifier, this.company, 'read', false)


        })
        it('should fail to change permission of user in another org', function(){
           //return PermissionService.addPermissionCatalexUser(this.user2.passports[0].identifier, this.company, 'read', false)

        })


        after(function(){
            return Promise.all([this.user1.destroy(), this.user2.destroy(), this.user3.destroy(), Permission.destroy({where: {}}), Organisation.destroy({where:{organisationId: 1}}), Organisation.destroy({where:{organisationId: 2}})])
                .then(function () {
                    return sails.hooks['sails-permissions'].initializeFixtures(sails);
                });
        });

    })

})