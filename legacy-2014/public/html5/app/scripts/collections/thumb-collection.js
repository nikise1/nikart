/* global define */
define([
    'backbone',
    'models/thumb-model'
], function (Backbone, ThumbModel) {
    'use strict';

    var Collection = Backbone.Collection.extend({

        model: ThumbModel
    });

    return new Collection();
});
