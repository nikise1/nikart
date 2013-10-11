/* global define */
define([
    'backbone',
    'underscore',
    'tweenlite',
    'common/common',
    'events/vent',
    'text!templates/nav-item-template.html'
], function (Backbone, _, TweenLite, common, vent, navItemTemplate) {
    'use strict';

    var View = Backbone.View.extend({

        tagName: 'div',

        className: 'nav-item-container',

        template: _.template(navItemTemplate),

        events: {
            'click .nav-item': 'clickHandler'
        },

        initialize: function () {
//            this.listenTo(this.model, 'destroy', this.remove);
        },

        render: function () {
            this.$el.html(this.template(this.model.toJSON()));
            this.$el.fadeTo(0, 0);
            this.$navItemSpan = this.$el.find('.nav-item-span');
            return this;
        },

        removeTweensAndDelays: function () {
            TweenLite.killDelayedCallsTo(this.aniStartIn);
            TweenLite.killDelayedCallsTo(this.aniStartOut);
            TweenLite.killTweensOf(this.$el);
        },

        aniIn: function (delay) {
            this.$el.fadeTo(0, 0);
            TweenLite.delayedCall(delay, this.aniStartIn, [], this);
        },

        aniStartIn: function () {
            if (!this.origWidth) {
                this.origWidth = this.$navItemSpan.width();
//                console.log('this.origWidth: ' + this.origWidth);
            }
            TweenLite.fromTo(this.$el, common.timeNavIn, {width: 0, autoAlpha: 1}, {width: this.origWidth, autoAlpha: 1});
        },

        aniOut: function (delay) {
            TweenLite.delayedCall(delay, this.aniStartOut, [], this);
        },

        aniStartOut: function () {
            TweenLite.to(this.$el, common.timeNavOut, {width: 0});
        },

        clickHandler: function () { //(event)
            vent.trigger(vent.ventNavItemClicked, this.model.get('id'));
        }
    });

    return View;
});
