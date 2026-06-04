'use strict';

// Flash version, now not able to open in modern browsers but could still have a route somewhere for testing purposes

var appModel = require('../models/appModel');

var flController = function (app) {

    app.get('/fl', function (req, res) {
        var langCode = appModel.getLangCode(req, res);
        var staticFilesStr = appModel.getStaticFilesStr(app);
        res.render('fl', {
            langCode: langCode,
            staticFilesStr: staticFilesStr
        });
    });

    app.get('/fl/:lang', function (req, res) {
        appModel.setLangCode(req, res, req.params.lang);
        res.redirect('fl');
    });
};

module.exports = flController;