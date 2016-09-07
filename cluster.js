var cluster = require('cluster'),
    kue = require('kue');

/**
 * app.js
 *
 * Use `app.js` to run your app without `sails lift`.
 * To start the server, run: `node app.js`.
 *
 * This is handy in situations where the sails CLI is not relevant or useful.
 *
 * For example:
 *   => `node app.js`
 *   => `forever start app.js`
 *   => `node debug app.js`
 *   => `modulus deploy`
 *   => `heroku scale`
 *
 *
 * The same command-line arguments are supported, e.g.:
 * `node app.js --silent --port=80 --prod`
 */

// Ensure we're in the project directory, so relative paths work as expected
// no matter where we actually lift from.
// Ensure a "sails" can be located:

process.chdir(__dirname);
if (cluster.isMaster) {

  // Keep track of http requests
  var numReqs = 0;
  // Count requests
  function messageHandler(msg) {
    if (msg.cmd && msg.cmd == 'notifyRequest') {
      numReqs += 1;
    }
  }

  kue.app.listen(3000);
  // Start workers and listen for messages containing notifyRequest
  for (var i = 0; i < process.env.NUM_WORKERS; i++) {
    cluster.fork();
  }

 /* Object.keys(cluster.workers).forEach((id) => {
    cluster.workers[id].on('message', messageHandler);
  });*/

} else {

    require('./worker');


}