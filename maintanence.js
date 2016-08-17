var rc = require('rc');
var config = rc('sails');
var express = require('express');
var app = express();

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

function render(req, res) {
  res.render('maintenance.ejs', {});
}

app.get('/', render);
app.get('/*', render);

app.listen(config.port, function () {
    console.log('Maintenance Page Up')
});


