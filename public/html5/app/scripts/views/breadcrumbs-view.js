/* global define */
define([
    'backbone',
    'tweenlite',
    'events/vent'
], function (Backbone, TweenLite, vent) {
    'use strict';

    var View = Backbone.View.extend({

        el: '.breadcrumbs',

        events: {
//            'click .nav-btn-container': 'toggle'
        },

        initialize: function () {
            this.appModel = this.options.appModel;
            this.appModel.injectModelsAndColls(this);

            this.listenTo(vent, vent.ventPathUpdate, this.pathUpdate);

            this.render();
        },

        render: function () {

            var str = '';
            for (var i = 0; i < this.appModel.pathArr.length; i++) {
                var curItemTemp = this.appModel.pathArr[i];
                str += '<div class="breadcrumb-container">';
                str += '<span class="breadcrumb-connector"></span>';
                str += '<a class="breadcrumb-link" href="#' + curItemTemp.id + '">' + curItemTemp.title + '</a>';
                str += '</div>';
            }

            this.$el.html(str);

            return this;
        },

        pathUpdate: function () {
            this.render();
        }
    });

    return View;
});
