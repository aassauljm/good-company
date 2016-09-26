import kue from 'kue';

export const importQueue = kue.createQueue({
    disableSearch: false
})
/*.on('job complete', function(id, result){
    kue.Job.get(id, function(err, job){
        console.log('success', err)
        if (err) return;
        console.log('success', job)
    });
})
.on('job failed', function(id, result){
    kue.Job.get(id, function(err, job){
        console.log('failed', err)
        if (err) return;
        console.log('failed', job)
    });
});*/
