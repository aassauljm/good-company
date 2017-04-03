describe('Organisation Model', function() {
    describe('Organisation Populate and Query', function() {
        let user;
        it('populate', function() {
            return User.create({username: 'test1', email: 'test1@email.com'})
            .then(_user => {
                user = _user;
                return Organisation.updateOrganisation({
                    name: 'test',
                    organisation_id: 1,
                    members: [
                        {name: 'test1', email: 'test1@email.com', id: 1, roles: ['organisation_admin']},
                        {name: 'test2', email: 'test2@email.com', id: 2, roles: []}
                    ]
                })
            })
            .then(() => {
                return Passport.create({'identifier': '1', provider: 'catalex', userId: user.id});
            })
            .then(() => {
                return User.getOrganisationInfo(user.id)
            })
            .then((org) => {
                 _.omitDeep(org, 'userId')
                    .should.deep.equal([
                      {"id":10001,"organisationId":1,"catalexId":"1","name":"test1","email":"test1@email.com", roles: ['organisation_admin']},
                      {"id":10002,"organisationId":1,"catalexId":"2","name":"test2","email":"test2@email.com", roles: []}
                    ])
            });
        });


        after(() => {
            return Organisation.destroy({where: {organisationId: 1}})
        });
    })
});