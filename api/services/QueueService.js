import kue from 'kue';

export const importQueue = kue.createQueue({
    disableSearch: false
});

export const importHistoryQueue = kue.createQueue({
    disableSearch: false
});

export const transactionQueue = kue.createQueue({
    disableSearch: false
});

