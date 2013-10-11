'use strict';

//*** Libraries ***
var express = require('express'),
    swig = require('swig'),
    _ = require('underscore');
//*** Controllers ***
var indexController = require('./app/controllers/index');
var html5Controller = require('./app/controllers/html5');
var flController = require('./app/controllers/fl');
var AppModel = require('./app/models/appModel');

var app = express();

//app.use(express.logger());

// development only
app.configure('development', function () {
    // Swig will cache templates for you, but you can disable
    // that and use Express's caching instead, if you like:
    app.set('view cache', false);
    // To disable Swig's cache, do the following:
    swig.setDefaults({ cache: false });
    // NOTE: You should always cache templates in a production environment.
    // Don't leave both of these to `false` in production!
});

// production only
app.configure('production', function () {
    app.use(express.compress());
});

app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', './app/views');

app.use(express.static('./public'));
app.use(express.cookieParser());
//app.use(express.cookieSession({secret: 'nikart'}));

indexController(app);
html5Controller(app);
flController(app);

var port = process.env.PORT || 5000;
app.listen(port, function () {
    console.log("Listening on " + port);
});