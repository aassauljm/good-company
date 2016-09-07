var Sails = require('sails').constructor;
var kue = require('kue');
var app = new Sails();
var queue = kue.createQueue();

app.load({
        log: {
            level: 'silly'
        },
    models: {
        migrate: 'safe'
    },
    hooks: {
        blueprints: false,
        controllers: false,
        cors: false,
        csrf: false,
        grunt: false,
        http: false,
        i18n: false,
        "orm": false,
        "userPermissions": false,
        //logger: false,
        policies: false,
        pubsub: false,
        request: false,
        responses: false,
        //services: leave default hook,
        session: false,
        sockets: false,
        views: false
    }
}, function(err, app){
    if(err){
        console.log(err)
        return;
    };

    queue.process('import', 10, function(job, done){
        ImportService.importCompany(2345234, {});
    });

});