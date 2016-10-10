import kue from 'kue';
import reds from 'reds';
import Promise from 'bluebird'
const asyncJob = Promise.promisifyAll(kue.Job);

let  search;

function getSearch() {
    if( search ) return search;
    reds.createClient = require('kue/lib/redis').createClient;
    return search = reds.createSearch(QueueService.importQueue.client.getKey('search'));
}

export const importQueue = kue.createQueue({
    disableSearch: false
});

export const importHistoryQueue = kue.createQueue({
    disableSearch: false
});

export const transactionQueue = kue.createQueue({
    disableSearch: false
});



export function searchJobs(query){
    return new Promise((resolve, reject) => {
        return getSearch()
            .query(query)
            .end(function( err, ids ) {
                if(err){
                    return reject(err);
                }
                return Promise.map(ids, (id) => asyncJob.getAsync(id).catch(e => null))
                    .then(jobs => resolve(jobs))
            })
    });
}