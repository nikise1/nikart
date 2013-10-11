/* global define */
define([
    'backbone',
    'underscore',
    'common/common',
    'events/vent',
    'text!templates/thumb-item-template.html'
], function (Backbone, _, common, vent, thumbItemTemplate) {
    'use strict';

    var View = Backbone.View.extend({

        tagName: 'li',

        className: 'thumb-item-container',

        template: _.template(thumbItemTemplate),

        events: {
            'click .thumb-label': 'onItemClick',
            'click .thumb-img': 'onItemClick'
        },

        initialize: function () {
        },

        render: function () {

            this.$el.html(this.template(this.model.toJSON()));
            var url = common.urlImg() + '/' + this.model.id + '.jpg';
            var img = this.$el.find('img')[0];
            img.src = url;

            this.$thumbLabel = this.$el.find('.thumb-label');
            this.$thumbLabel.css('cursor', 'pointer');
            this.$thumbImg = this.$el.find('.thumb-img');
            this.$thumbImg.css('cursor', 'pointer');

            return this;
        },

        onItemClick: function () {
            vent.trigger(vent.ventThumbItemClicked, this.model.get('id'));
        }
    });

    return View;
});
