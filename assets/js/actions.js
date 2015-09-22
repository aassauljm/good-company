import Reflux from 'reflux';

Reflux.setPromise(require('bluebird'));

export default Reflux.createActions({
    "login": {children: ['success', 'failure']},
    "setLogin": {},
    "setLoggedIn": {},

    "userInfo": {children: ['success', 'failure']},
    "setUserInfo": {},
});

