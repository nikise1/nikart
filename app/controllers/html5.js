'use strict';

var appModel = require('../models/appModel');

var html5Controller = function (app) {

    app.get('/html5', function (req, res) {
        var langCode = appModel.getLangCode(req, res);
        var staticFilesStr = appModel.getStaticFilesStr(app);
        res.render('html5', {
            langCode: langCode,
            staticFilesStr: staticFilesStr
        });
    });

    app.get('/html5/:lang', function (req, res) {
        appModel.setLangCode(req, res, req.params.lang);
        res.redirect('html5');
    });
};

module.exports = html5Controller;