import kue from 'kue';
import Promise from 'bluebird'
const asyncJob = Promise.promisifyAll(kue.Job);

export const importQueue = kue.createQueue();

export const importHistoryQueue = kue.createQueue();

export const transactionQueue = kue.createQueue();



export function searchJobs(query){
    return asyncJob.rangeAsync(0, -1, 'asc')
        .then(jobs => {
            return jobs.filter(j => j.data.userId === query).map(j => j.toJSON())
        })
}

const interval = 1000;
importQueue.watchStuckJobs(interval);
importHistoryQueue.watchStuckJobs(interval);
transactionQueue.watchStuckJobs(interval);