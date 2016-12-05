import kue from 'kue';
import Promise from 'bluebird'
const asyncJob = Promise.promisifyAll(kue.Job);

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
    return asyncJob.rangeAsync(0, -1, 'asc')
        .then(jobs => {
            return jobs.filter(j => j.data.userId === query).map(j => j.toJSON())
        })
}
