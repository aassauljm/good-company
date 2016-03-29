const Promise = require('bluebird');

export const normalizeAddress = Promise.method(function(address){
    address = (address || '').replace(/^C\/- /, '').replace(/ \d{4,5}, /, ' ').replace('Null, ', '');
    return address.replace(/, NZ$/, ', New Zealand')
});

export function compareAddresses(first, second){
    first = first || '';
    second = second || '';
    first = first.toLowerCase();
    second = second.toLowerCase();
    if(first === second){
        return true;
    }
    first =  first.replace(/,/g, '');
    second = second.replace(/,/g, '');

    if(first === second){
        return true;
    }

    first =  first.replace(/\./g, ' ');
    second = second.replace(/\./g, ' ');

    if(first === second){
        return true;
    }

    first =  first.replace(/ /g, '');
    second = second.replace(/ /g, '');
    if(first === second){
        return true;
    }
    return false;
}