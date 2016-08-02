var Sails = require('sails').constructor;
var app = new Sails();

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
    };
    ImportService.importCompany(2345234, {})
});