'use strict';

var appModel = require('../models/appModel');

var html5Controller = function (app) {

    app.get('/html5', function (req, res) {
        var langCode = appModel.getLangCode(req, res);
        var staticFilesStr = appModel.getStaticFilesStr(app);
        var menuStr = (langCode === 'en') ? 'Menu' : 'Menú';
        var debug = (req.query.debug && parseInt(req.query.debug, 10) === 1) ? true : false;
        res.render('html5', {
            debug: debug,
            langCode: langCode,
            staticFilesStr: staticFilesStr,
            menuStr: menuStr
        });
    });

    app.get('/html5/:lang', function (req, res) {
        appModel.setLangCode(req, res, req.params.lang);
        res.redirect('/');
    });
};

module.exports = html5Controller;