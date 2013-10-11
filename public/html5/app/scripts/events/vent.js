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
        ventNavItemClicked: 'ventNavItemClicked',

        ventPathUpdate: 'ventPathUpdate',

        ventThumbOpen: 'ventThumbOpen',
        ventThumbClose: 'ventThumbClose',
        ventThumbItemClicked: 'ventThumbItemClicked',

        ventArticleOpen: 'ventArticleOpen',
        ventArticleClose: 'ventArticleClose',
        ventVideoOpen: 'ventVideoOpen',
        ventVideoClose: 'ventVideoClose'

    };

    _.extend(vent, Backbone.Events);

    return vent;
});