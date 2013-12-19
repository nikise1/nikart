'use strict';

var data = {
};
exports.data = data;

exports.getLangCode = function (req, res) {
    var langCode;
    var newLangCode;
    if (req.cookies && req.cookies.langcode) {
        langCode = req.cookies.langcode;
    }
    if (!langCode) {
        var acceptLanguage = req.headers['accept-language'];
        if (acceptLanguage) {
            newLangCode = acceptLanguage.substr(0, 2);
        }
        langCode = newLangCode;
    }
    if (langCode !== 'en' && langCode !== 'es') {
        langCode = 'en';
    }
    return langCode;
};

exports.setLangCode = function (req, res, newLangCode) {
    res.cookie('langcode', newLangCode, { maxAge: 2.62974e9, httpOnly: true });
};

exports.getStaticFilesStr = function (app) {
//    var staticFilesStr = 'http://static.nikart.co.uk.s3-website-us-east-1.amazonaws.com';
    var staticFilesStr = 'http://static.nikart.co.uk';
    if ('development' === app.get('env')) {
        staticFilesStr = '../static';
    }
    return staticFilesStr;
};