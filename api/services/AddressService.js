const Promise = require('bluebird');
import _ from 'lodash';


export function lookupAddress(user, addressString, postal=false){
    addressString = addressString.replace(/ New Zealand$/, ' NZ');
    return AddressQueries.findOne({where: {query: addressString}})
        .then(result => {
            if(!result){
                // do a look up
                return MbieApiBearerTokenService.getUserToken(user.id, 'companies-office')
                    .then(bearerToken => {
                        return MbieSyncService.fetchUrl(bearerToken, UtilService.buildUrl(`${sails.config.mbie.companiesOffice.url}companies/addresses`, {find: addressString, limit: 10, postal}))
                    })
                    .then((result) => {
                        return AddressQueries.create({query: addressString, addresses: result.body.items});
                    })
                    .catch(result => {
                        return AddressQueries.build({query: addressString, addresses: []})
                    })
            }
            return result;
        });

}

export const normalizeAddress = Promise.method(function(address){
    address = (address || '').replace(/^C\/- /, '').replace(/ \d{4,5}, /, ' ').replace('Null, ', '');
    return isoCodes.reduce((acc, pair) => {
        return acc.replace(pair[0], pair[1]);
    }, address)
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
    '\\sDve(\\W)': ' Drv$1',
    '\\sLevel(\\W)': ' L$1',
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


    const firstParts = first.split(',')
    const secondParts = second.split(',')
    // split and see if first or second just has extra token

    if(_.xor(firstParts, secondParts).length === 0 || _.xor(firstParts, secondParts).length === 1){
        return true;
    }

    // drop postal codes
    first =  first.replace(/(\d){4,6},?/g, ' ').replace(/ +/g, ' ');
    second = second.replace(/(\d){4,6},?/g, ' ').replace(/ +/g, ' ');

    if(first === second){
        return true;
    }


    // see if there are many tokens and one token has swapped
    if(firstParts.length > 4 && _.intersection(firstParts, secondParts).length === firstParts.length-1){
        return true;
    }

    if(firstParts[0] === secondParts[0] && _.intersection(firstParts, secondParts).length === firstParts.length-1){
        return true;
    }

    first =  first.replace(/,/g, ' ').replace(/ +/g, ' ');
    second = second.replace(/,/g, ' ').replace(/ +/g, ' ');

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

const isoCodes = [
    [/AF$/, "Afghanistan"],
    [/AX$/, "Aland Islands"],
    [/AL$/, "Albania"],
    [/DZ$/, "Algeria"],
    [/AS$/, "American Samoa"],
    [/AD$/, "Andorra"],
    [/AO$/, "Angola"],
    [/AI$/, "Anguilla"],
    [/AQ$/, "Antarctica"],
    [/AG$/, "Antigua And Barbuda"],
    [/AR$/, "Argentina"],
    [/AM$/, "Armenia"],
    [/AW$/, "Aruba"],
    [/AU$/, "Australia"],
    [/AT$/, "Austria"],
    [/AZ$/, "Azerbaijan"],
    [/BS$/, "Bahamas"],
    [/BH$/, "Bahrain"],
    [/BD$/, "Bangladesh"],
    [/BB$/, "Barbados"],
    [/BY$/, "Belarus"],
    [/BE$/, "Belgium"],
    [/BZ$/, "Belize"],
    [/BJ$/, "Benin"],
    [/BM$/, "Bermuda"],
    [/BT$/, "Bhutan"],
    [/BO$/, "Bolivia"],
    [/BA$/, "Bosnia And Herzegovina"],
    [/BW$/, "Botswana"],
    [/BV$/, "Bouvet Island"],
    [/BR$/, "Brazil"],
    [/IO$/, "British Indian Ocean Territory"],
    [/BN$/, "Brunei Darussalam"],
    [/BG$/, "Bulgaria"],
    [/BF$/, "Burkina Faso"],
    [/BI$/, "Burundi"],
    [/KH$/, "Cambodia"],
    [/CM$/, "Cameroon"],
    [/CA$/, "Canada"],
    [/CV$/, "Cape Verde"],
    [/KY$/, "Cayman Islands"],
    [/CF$/, "Central African Republic"],
    [/TD$/, "Chad"],
    [/CL$/, "Chile"],
    [/CN$/, "China"],
    [/CX$/, "Christmas Island"],
    [/CC$/, "Cocos (Keeling) Islands"],
    [/CO$/, "Colombia"],
    [/KM$/, "Comoros"],
    [/CG$/, "Congo"],
    [/CD$/, "Congo, Democratic Republic"],
    [/CK$/, "Cook Islands"],
    [/CR$/, "Costa Rica"],
    [/CI$/, "Cote D\'Ivoire"],
    [/HR$/, "Croatia"],
    [/CU$/, "Cuba"],
    [/CY$/, "Cyprus"],
    [/CZ$/, "Czech Republic"],
    [/DK$/, "Denmark"],
    [/DJ$/, "Djibouti"],
    [/DM$/, "Dominica"],
    [/DO$/, "Dominican Republic"],
    [/EC$/, "Ecuador"],
    [/EG$/, "Egypt"],
    [/SV$/, "El Salvador"],
    [/GQ$/, "Equatorial Guinea"],
    [/ER$/, "Eritrea"],
    [/EE$/, "Estonia"],
    [/ET$/, "Ethiopia"],
    [/FK$/, "Falkland Islands (Malvinas)"],
    [/FO$/, "Faroe Islands"],
    [/FJ$/, "Fiji"],
    [/FI$/, "Finland"],
    [/FR$/, "France"],
    [/GF$/, "French Guiana"],
    [/PF$/, "French Polynesia"],
    [/TF$/, "French Southern Territories"],
    [/GA$/, "Gabon"],
    [/GM$/, "Gambia"],
    [/GE$/, "Georgia"],
    [/DE$/, "Germany"],
    [/GH$/, "Ghana"],
    [/GI$/, "Gibraltar"],
    [/GR$/, "Greece"],
    [/GL$/, "Greenland"],
    [/GD$/, "Grenada"],
    [/GP$/, "Guadeloupe"],
    [/GU$/, "Guam"],
    [/GT$/, "Guatemala"],
    [/GG$/, "Guernsey"],
    [/GN$/, "Guinea"],
    [/GW$/, "Guinea-Bissau"],
    [/GY$/, "Guyana"],
    [/HT$/, "Haiti"],
    [/HM$/, "Heard Island & Mcdonald Islands"],
    [/VA$/, "Holy See (Vatican City State)"],
    [/HN$/, "Honduras"],
    [/HK$/, "Hong Kong"],
    [/HU$/, "Hungary"],
    [/IS$/, "Iceland"],
    [/IN$/, "India"],
    [/ID$/, "Indonesia"],
    [/IR$/, "Iran, Islamic Republic Of"],
    [/IQ$/, "Iraq"],
    [/IE$/, "Ireland"],
    [/IM$/, "Isle Of Man"],
    [/IL$/, "Israel"],
    [/IT$/, "Italy"],
    [/JM$/, "Jamaica"],
    [/JP$/, "Japan"],
    [/JE$/, "Jersey"],
    [/JO$/, "Jordan"],
    [/KZ$/, "Kazakhstan"],
    [/KE$/, "Kenya"],
    [/KI$/, "Kiribati"],
    [/KR$/, "Korea"],
    [/KW$/, "Kuwait"],
    [/KG$/, "Kyrgyzstan"],
    [/LA$/, "Lao People\'s Democratic Republic"],
    [/LV$/, "Latvia"],
    [/LB$/, "Lebanon"],
    [/LS$/, "Lesotho"],
    [/LR$/, "Liberia"],
    [/LY$/, "Libyan Arab Jamahiriya"],
    [/LI$/, "Liechtenstein"],
    [/LT$/, "Lithuania"],
    [/LU$/, "Luxembourg"],
    [/MO$/, "Macao"],
    [/MK$/, "Macedonia"],
    [/MG$/, "Madagascar"],
    [/MW$/, "Malawi"],
    [/MY$/, "Malaysia"],
    [/MV$/, "Maldives"],
    [/ML$/, "Mali"],
    [/MT$/, "Malta"],
    [/MH$/, "Marshall Islands"],
    [/MQ$/, "Martinique"],
    [/MR$/, "Mauritania"],
    [/MU$/, "Mauritius"],
    [/YT$/, "Mayotte"],
    [/MX$/, "Mexico"],
    [/FM$/, "Micronesia, Federated States Of"],
    [/MD$/, "Moldova"],
    [/MC$/, "Monaco"],
    [/MN$/, "Mongolia"],
    [/ME$/, "Montenegro"],
    [/MS$/, "Montserrat"],
    [/MA$/, "Morocco"],
    [/MZ$/, "Mozambique"],
    [/MM$/, "Myanmar"],
    [/NA$/, "Namibia"],
    [/NR$/, "Nauru"],
    [/NP$/, "Nepal"],
    [/NL$/, "Netherlands"],
    [/AN$/, "Netherlands Antilles"],
    [/NC$/, "New Caledonia"],
    [/NZ$/, "New Zealand"],
    [/NI$/, "Nicaragua"],
    [/NE$/, "Niger"],
    [/NG$/, "Nigeria"],
    [/NU$/, "Niue"],
    [/NF$/, "Norfolk Island"],
    [/MP$/, "Northern Mariana Islands"],
    [/NO$/, "Norway"],
    [/OM$/, "Oman"],
    [/PK$/, "Pakistan"],
    [/PW$/, "Palau"],
    [/PS$/, "Palestinian Territory, Occupied"],
    [/PA$/, "Panama"],
    [/PG$/, "Papua New Guinea"],
    [/PY$/, "Paraguay"],
    [/PE$/, "Peru"],
    [/PH$/, "Philippines"],
    [/PN$/, "Pitcairn"],
    [/PL$/, "Poland"],
    [/PT$/, "Portugal"],
    [/PR$/, "Puerto Rico"],
    [/QA$/, "Qatar"],
    [/RE$/, "Reunion"],
    [/RO$/, "Romania"],
    [/RU$/, "Russian Federation"],
    [/RW$/, "Rwanda"],
    [/BL$/, "Saint Barthelemy"],
    [/SH$/, "Saint Helena"],
    [/KN$/, "Saint Kitts And Nevis"],
    [/LC$/, "Saint Lucia"],
    [/MF$/, "Saint Martin"],
    [/PM$/, "Saint Pierre And Miquelon"],
    [/VC$/, "Saint Vincent And Grenadines"],
    [/WS$/, "Samoa"],
    [/SM$/, "San Marino"],
    [/ST$/, "Sao Tome And Principe"],
    [/SA$/, "Saudi Arabia"],
    [/SN$/, "Senegal"],
    [/RS$/, "Serbia"],
    [/SC$/, "Seychelles"],
    [/SL$/, "Sierra Leone"],
    [/SG$/, "Singapore"],
    [/SK$/, "Slovakia"],
    [/SI$/, "Slovenia"],
    [/SB$/, "Solomon Islands"],
    [/SO$/, "Somalia"],
    [/ZA$/, "South Africa"],
    [/GS$/, "South Georgia And Sandwich Isl."],
    [/ES$/, "Spain"],
    [/LK$/, "Sri Lanka"],
    [/SD$/, "Sudan"],
    [/SR$/, "Suriname"],
    [/SJ$/, "Svalbard And Jan Mayen"],
    [/SZ$/, "Swaziland"],
    [/SE$/, "Sweden"],
    [/CH$/, "Switzerland"],
    [/SY$/, "Syrian Arab Republic"],
    [/TW$/, "Taiwan"],
    [/TJ$/, "Tajikistan"],
    [/TZ$/, "Tanzania"],
    [/TH$/, "Thailand"],
    [/TL$/, "Timor-Leste"],
    [/TG$/, "Togo"],
    [/TK$/, "Tokelau"],
    [/TO$/, "Tonga"],
    [/TT$/, "Trinidad And Tobago"],
    [/TN$/, "Tunisia"],
    [/TR$/, "Turkey"],
    [/TM$/, "Turkmenistan"],
    [/TC$/, "Turks And Caicos Islands"],
    [/TV$/, "Tuvalu"],
    [/UG$/, "Uganda"],
    [/UA$/, "Ukraine"],
    [/AE$/, "United Arab Emirates"],
    [/GB$/, "United Kingdom"],
    [/US$/, "United States"],
    [/UM$/, "United States Outlying Islands"],
    [/UY$/, "Uruguay"],
    [/UZ$/, "Uzbekistan"],
    [/VU$/, "Vanuatu"],
    [/VE$/, "Venezuela"],
    [/VN$/, "Viet Nam"],
    [/VG$/, "Virgin Islands, British"],
    [/VI$/, "Virgin Islands, U.S."],
    [/WF$/, "Wallis And Futuna"],
    [/EH$/, "Western Sahara"],
    [/YE$/, "Yemen"],
    [/ZM$/, "Zambia"],
    [/ZW$/,"Zimbabwe"]];