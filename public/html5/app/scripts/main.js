require.config({
    // The shim config allows us to configure dependencies for
    // scripts that do not call define() to register a module
    shim: {
        underscore: {
            exports: '_'
        },
        backbone: {
            deps: [
                'underscore',
                'jquery'
            ],
            exports: 'Backbone'
        },
        tweenlite: {
            deps: [
                'cssplugin'
            ],
            exports: 'TweenLite'
        },
        cssplugin: {
            exports: 'CSSPlugin'
        },
        consolepolyfill: {exports: ''}
    },
    paths: {
        jquery: '../bower_components/jquery/jquery.min',
        underscore: '../bower_components/underscore/underscore-min',
        backbone: '../bower_components/backbone/backbone-min',
        text: '../bower_components/requirejs-text/text',
        consolepolyfill: '../bower_components/console-polyfill/index',

        jplayer: '../bower_components/jplayer/jquery.jplayer/jquery.jplayer',

        tweenlite: '../bower_components/tweenmax/src/minified/TweenLite.min',
        cssplugin: '../bower_components/tweenmax/src/minified/plugins/CSSPlugin.min'
//        tweenlite: '../bower_components/tweenmax/src/uncompressed/TweenLite',
//        cssplugin: '../bower_components/tweenmax/src/uncompressed/plugins/CSSPlugin'
    }
});

require([
    'backbone',
    'routers/router',
    'views/app-view',
    'consolepolyfill'
], function (Backbone, AppRouter, AppView) {
    'use strict';

    var appRouter = new AppRouter();
    var appView = new AppView();
    appView.setRouter(appRouter);
});
