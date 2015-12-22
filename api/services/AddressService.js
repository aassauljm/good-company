const Promise = require('bluebird');

export const normalizeAddress = Promise.method(function(address){
    address = (address || '').replace(/^C\/- /, '').replace(/, \d{4,5}, /, ', ');
    return address.replace(/, NZ$/, ', New Zealand')
});

export function compareAddresses(first, second){
    first = first.toLowerCase();
    second = second.toLowerCase();
    if(first === second){
        return true;
    }
    else if(first.replace(/,/g, '') === second.replace(/,/g, '')){
        return true;
    }
    return false;
}