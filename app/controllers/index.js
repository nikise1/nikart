'use strict';

var appModel = require('../models/appModel');

var controller = function (app) {

    app.get('/en', function (req, res) {
        appModel.setLangCode(req, res, 'en');
        res.redirect('/');
    });

    app.get('/es', function (req, res) {
        appModel.setLangCode(req, res, 'es');
        res.redirect('/');
    });

    app.get('/', function (req, res) {
//        var isWindows = false;
//        var isMacintosh = false;
//        var userAgent = req.headers['user-agent'];
//        if (userAgent) {
//            isWindows = userAgent.indexOf('Windows') !== -1;
//            isMacintosh = userAgent.indexOf('Macintosh') !== -1;
//        }
//        if (isWindows || isMacintosh) {
//            res.render('index', {
//                userAgent: userAgent,
//                isWindows: 'isWindows: ' + isWindows,
//                isMacintosh: 'isMacintosh: ' + isMacintosh
//            });
//        } else {
//            res.redirect('/html5');
//        }
        res.redirect('/html5');
    });
};

module.exports = controller;