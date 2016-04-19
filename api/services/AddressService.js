const Promise = require('bluebird');

export const normalizeAddress = Promise.method(function(address){
    address = (address || '').replace(/^C\/- /, '').replace(/ \d{4,5}, /, ' ').replace('Null, ', '');



    return address.replace(/, NZ$/, ', New Zealand')
});

const hackReplace = {
    '\\sAvenue(\\W)': ' Ave$1',
    '\\sBoulevard(\\W)': ' Blvd$1',
    '\\sBvd(\\W)': ' Blvd$1',
    '\\sStreet(\\W)': ' St$1',
    '\\sRoad(\\W)': ' Rd$1',
    '\\sLane(\\W)': ' Ln$1',
    '\\sWay(\\W)': ' Wy$1',
    '\\sCircle(\\W)': ' Cr$1',
    '\\sPlace(\\W)': ' Pl$1',
    '\\sDrive(\\W)': ' Drv$1',
    '\\sDve(\\W)': ' Drv$1'
}

const hackReplaceRegex = Object.keys(hackReplace).reduce((acc, k) => {
    acc.push([new RegExp(k, 'gi'), hackReplace[k]]);
    return acc;
}, [])

export function compareAddresses(first, second){
    first = first || '';
    second = second || '';
    hackReplaceRegex.map(k => {
        first = first.replace(k[0], k[1]);
        second = second.replace(k[0], k[1]);
    });
    if(first === second){
        return true;
    }

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

    first = first.replace(/ /g, '');
    second = second.replace(/ /g, '');
    if(first === second){
        return true;
    }
    return false;
}

