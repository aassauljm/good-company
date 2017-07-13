import Promise from 'bluebird';
import fetch from "isomorphic-fetch";
import FormData from 'form-data';
var mime = require('mime-types');


module.exports = {

    fetchUserDetails: function(args) {
        let form = new FormData();
        form.append('client_id', sails.config.OAUTH_CLIENT_ID);
        form.append('client_secret', sails.config.OAUTH_CLIENT_SECRET);
        form.append('email', args.email);
        form.append('name', args.name);
        form.append('sender_name', args.senderName);
        form.append('company_name', args.companyName);
        sails.log.info('Getting info for', args.email)
        sails.log.info('From ', sails.config.ACCOUNT_URL + '/user/invite-user')
        return fetch(sails.config.ACCOUNT_URL + '/user/invite-user', {
            method: 'POST',
            header: {
                'Accept': '*/*',
                'Content-type': 'multipart/form-data'
            },
            body: form
        })
        .then(response => response.text())
        .then(function(text) {
            console.log(text)
            return text ? JSON.parse(text) : text;
        })
        .then(json => {
            json.username = json.name;
            return json;
        })
    },

    findOrCreateUserAndNotify: function(args) {

        return new Promise((resolve, reject) => {
                CatalexUsersService.fetchUserDetails(args)
                .then((profile) => {
                    // create user with passport
                    const user = {username: profile.name, email: profile.email};
                    sails.log.info('Got User: ', user)
                    return sails.services.passport.updatePassport({provider: 'catalex', identifier: profile.id.toString()}, user, profile, (error, user) => {
                        resolve({catalexId: profile.id.toString()});
                    })

                })
                .catch(e => {
                    sails.log.error(e);
                    reject(e);
                })
            })
    }
}