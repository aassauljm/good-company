const Promise = require('bluebird');

export const normalizeAddress = Promise.method(function(address){
    address = (address || '').replace(/^C\/- /, '').replace(/ \d{4,5}, /, ' ').replace('Null, ', '');



    return address.replace(/, NZ$/, ', New Zealand')
});

const hackSuffixReplace = {
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

const hackCardinalReplace = {
    '\\sNorth(\\W)': '$1',
    '\\sSouth(\\W)': '$1',
    '\\sEast(\\W)': '$1',
    '\\sWest(\\W)': '$1'
}

const hackSuffixReplaceRegex = Object.keys(hackSuffixReplace).reduce((acc, k) => {
    acc.push([new RegExp(k, 'gi'), hackSuffixReplace[k]]);
    return acc;
}, []);

const hackCardinalReplaceRegex = Object.keys(hackCardinalReplace).reduce((acc, k) => {
    acc.push([new RegExp(k, 'gi'), hackCardinalReplace[k]]);
    return acc;
}, []);

export function compareAddresses(first, second){
    // who wrote this shit? lol

    first = first || '';
    second = second || '';

    hackSuffixReplaceRegex.map(k => {
        first = first.replace(k[0], k[1]);
        second = second.replace(k[0], k[1]);
    });
    if(first === second){
        return true;
    }

    hackCardinalReplaceRegex.map(k => {
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

    first =  first.replace(/,/g, ' ').replace(/ +/g, ' ');
    second = second.replace(/,/g, ' ').replace(/ +/g, ' ');

    if(first === second){
        return true;
    }

    // split and see if first or second just has extra token

    if(_.xor(first.split(' '), second.split(' ')).length === 1){
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

