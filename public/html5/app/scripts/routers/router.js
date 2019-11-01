/* global define */
define([
    'backbone',
    'events/vent'
], function (Backbone, vent) {
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
            vent.trigger(vent.ventBreadcrumbClicked, path);
        }
    });

    return Router;
});
