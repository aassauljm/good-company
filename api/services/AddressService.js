const Promise = require('bluebird');

export const normalizeAddress = Promise.method(function(address){
    address = (address || '').replace(/^C\/- /, '').replace(/, \d{4,5}, /, ', ');
    return address.replace(/, NZ$/, ', New Zealand')
});