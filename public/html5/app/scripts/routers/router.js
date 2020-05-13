/* global define */
define([
    'backbone',
    'events/vent'
], function (Backbone, vent) {
    'use strict';

    var Router = Backbone.Router.extend({
        routes: {
            '': 'index',
            '*idStr': 'openPath'
        },

        initialize: function (options) { // { options }
            console.log('router - initialize options: ' + options);
            this.listenTo(vent, vent.ventRouterNavigate, this.onNavigate);
        },

        index: function () {
            console.log('router - index');
            this.openPath('main');
        },
        
        onNavigate: function (idStr) {
            console.log('router - onNavigate');
            this.navigate(idStr, {trigger: true});
        },

        openPath: function (idStr) {
            console.log('router - openPath(' + idStr + ')');
            vent.trigger(vent.ventRouterUpdated, idStr);
        }
    });

    return Router;
});
