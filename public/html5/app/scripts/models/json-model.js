/* global define */
define([
    'backbone',
    'common/common'
], function (Backbone, common) {
    'use strict';

    var Model = Backbone.Model.extend({
        url: common.urlData()
    });

    return Model;
});