/* global define */
define([
    'backbone'
], function (Backbone) {
    'use strict';

    var Model = Backbone.Model.extend({

        defaults: {
            title: 'Default title'
        },

        // Don't save this model to the server
        sync: function () {
            return false;
        }

//        enableSync: function () {
//            // If this view's model is still pointing to our fake sync function,
//            // update it so that it references Backbone.sync going forward.
//            if (this.model.sync !== Backbone.sync) {
//                this.model.sync = Backbone.sync;
//            }
//        }
    });

    return Model;
});
