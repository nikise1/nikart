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
            // console.log('router initialize options: ' + options);
            this.listenTo(vent, vent.ventRouterNavigate, this.onNavigate);
        },

        index: function () {
            console.log('router - index');
        },
        
        onNavigate: function (path) {
            console.log('router - onNavigate');
            this.navigate(path, {trigger: true});
        },

        openPath: function (path) {
            console.log('router - openPath(' + path + ')');
            vent.trigger(vent.ventRouterUpdated, path);
        }
    });

    return Router;
});
