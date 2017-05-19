"use strict";
const https = require('https');
import url from 'url'
import Promise from 'bluebird';


export function subsetSum(items, targetSum) {
    //exponential implementation, sucks.
    // trivial case
    for (let i = 0; i < items.length; i++) {
        if (items[i] === targetSum) {
            return {
                vals: [items[i]],
                sum: targetSum
            };
        }
    }

    let solutionIndexes = null,
        finished = false;

    const sum = (function subset(lastSum, indexList) {
        const indexListLength = indexList.length;
        let i, sum = lastSum;
        for (let i = 0; i < items.length && !finished; i++) {
            // break early
            if (sum === targetSum) {
                finished = true;
                break;
            }

            if (indexList.indexOf(i) === -1) {
                indexList[indexListLength] = i;
                sum = lastSum + items[i];
                if (sum === targetSum && indexList.length > 1) {
                    solutionIndexes = indexList.slice(0);
                    finished = true;
                    break;
                } else {
                    sum = subset(sum, indexList.slice(0));
                }
            }
        }
        return sum;
    })(0, [])


    if (!solutionIndexes) {
        throw Error('Could not find solution')
    }
    // Return the solution set
    return {
        vals: solutionIndexes.sort().map(i => items[i]),
        sum: targetSum
    }

}

/**
 * Create the content for a basic auth header
 */
export function makeBasicAuthHeader(username, password) {
    const hash = new Buffer(username + ':' + password).toString('base64');
    const header = 'Basic ' + hash;
    return header;
}

/**
 * Take a base URI and an object of parameters.
 * Return a URI with the base URI and all the parameters form the object.
 */
export function buildUrl(baseUri, parameters={}) {
    // Build the parameters list
    let queryString = Object.keys(parameters).reduce((acc, key) => {
        const parameter = encodeURIComponent(parameters[key]);
        const queryValue = key + '=' + parameter + '&';

        return acc + queryValue;
    }, '?');

    // Remove the final '&' or '?' added by adding the parameters
    queryString = queryString.slice(0, -1);

    // Return the base uri plus the query string
    return baseUri + queryString;
}


// na, this sucks due to large targetSums
export function subsetSumMemoFail(items, targetSum) {
    // The value of subset[i][j] will be true if there is a subset of set[0..j-1]
    //  with sum equal to i
    const subset = [[]], n = items.length;
    // trivial case
    for (let i = 0; i < items.length; i++) {
        subset[0][i] = true;
        if (items[i] === targetSum) {
            return {
                vals: [items[i]],
                sum: targetSum
            };
        }
    }

    // Fill the subset table in botton up manner
    for (let i = 1; i <= targetSum; i++) {
        for (let j = 1; j <= n; j++) {
            if(!subset[i]){
                subset[i] = [false];
            }
            subset[i][j] = subset[i][j - 1] ;
            if (i >= items[j - 1]){
                subset[i][j] = subset[i][j] || (subset[i - items[j - 1]]||[])[j - 1];
            }
        }
    }

    /* // uncomment this code to print table
     for (int i = 0; i <= sum; i++)
     {
       for (int j = 0; j <= n; j++)
          printf ("%4d", subset[i][j]);
       printf("\n");
     } */
    if(!subset[targetSum][n]){
        throw Error('Could not find solution')
    }
    if(subset[targetSum][n]){
        subset[targetSum].map((v, i) => v ? i : null)
    }
}

export function logRequest(url, headers) {
    sails.log.info(`Requesting from MBIE ${url}  ${JSON.stringify(headers)}`);
}



export function httpsRequest(params, postData) {
    const urlParts = url.parse(params.url);
    console.log(params, urlParts, postData)
    return new Promise(function(resolve, reject) {
        var req = https.request({
                ...params,
                ...urlParts,
            }, function(res) {
            // reject on bad status
            if (res.statusCode < 200 || res.statusCode >= 300) {
               failedStatus = res.statusCode;
            }
            // cumulate data
            var body = [];
            var failedStatus;
            res.on('data', function(chunk) {
                body.push(chunk);
            });
            // resolve on end
            res.on('end', function() {
                try {
                    body = JSON.parse(Buffer.concat(body).toString());
                } catch(e) {
                    return reject(new sails.config.exceptions.BadRequest('Request failed', {status: failedStatus,  body: {}}));
                }
                if(failedStatus){
                    return reject(new sails.config.exceptions.BadRequest('Request failed', {status: failedStatus,  body: body}));
                }
                resolve(body);
            });
        });
        // reject on request error
        req.on('error', function(err) {
            // This is not a "Second reject", just a different sort of failure
            reject(err);
        });
        if (postData) {
            req.write(postData);
        }
        // IMPORTANT
        req.end();
    });
}

export function promiseWhile(predicate, action) {
    function loop() {
        if (!predicate()) return;
        return Promise.resolve(action()).then(loop);
    }
    return Promise.resolve().then(loop);
}
