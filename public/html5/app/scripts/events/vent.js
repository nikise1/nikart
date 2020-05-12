/* global define */
define([
    'backbone',
    'underscore'
], function (Backbone, _) {
    'use strict';

    var vent = {

        ventInitDataLoaded: 'ventInitDataLoaded',

        ventNavOpen: 'ventNavOpen',
        ventNavClose: 'ventNavClose',

        ventPathUpdate: 'ventPathUpdate',

        ventThumbOpen: 'ventThumbOpen',
        ventThumbClose: 'ventThumbClose',

        ventRouterNavigate: 'ventRouterNavigate',
        ventRouterUpdated: 'ventRouterUpdated',

        ventScrolling: 'ventScrolling',
        ventScrollingStopped: 'ventScrollingStopped',

        ventArticleOpen: 'ventArticleOpen',
        ventArticleClose: 'ventArticleClose',
        ventVideoOpen: 'ventVideoOpen',
        ventVideoClose: 'ventVideoClose'

    };

    _.extend(vent, Backbone.Events);

    return vent;
});