/* global define */
define([
    'backbone',
    'models/nav-model'
], function (Backbone, NavModel) {
    'use strict';

    var Collection = Backbone.Collection.extend({

        model: NavModel
    });

    return new Collection();
});
