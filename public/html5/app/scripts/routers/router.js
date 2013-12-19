/* global define */
define([
    'backbone'
], function (Backbone) {
    'use strict';

    var Router = Backbone.Router.extend({
        routes: {
            '': 'index',
            '*path': 'openPath'
        },

        initialize: function () { // { options }
//            console.log('router initialize options: ' + options);
        },

        index: function () {
        },

        openPath: function (path) {
            console.log('openPath(' + path + ')');
        }
    });

    return Router;
});
