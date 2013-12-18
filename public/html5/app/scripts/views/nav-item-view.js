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

        tagName: 'li',

        className: 'nav-item-container',

        template: _.template(navItemTemplate),

        events: {
            'click .nav-item': 'clickHandler'
        },

        initialize: function () {
            this.appModel = this.options.appModel;
            this.appModel.injectModelsAndColls(this);

            this.num = this.options.num;
            this.numNavItems = this.options.numNavItems;
            this.extraWidth = 20;
            this.curveModX = 148;
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

        aniIn: function () {
            var delay = common.timeNavGrowIn + this.num * common.timeNavStaggerIn;
            this.$el.fadeTo(0, 0);
            TweenLite.delayedCall(delay, this.aniStartIn, [], this);
        },

        aniStartIn: function () {
            if (!this.origWidth) {
                this.origWidth = this.$navItemSpan.width() + this.extraWidth;
//                console.log('this.origWidth: ' + this.origWidth);
                var fraction = (this.num + 1) / this.numNavItems;
                this.$el.css('margin-left', Math.sqrt(fraction * 2) / 2 * this.curveModX);
//                this.$el.css('margin-left', fraction * this.curveModX);
            }
            TweenLite.fromTo(this.$el, common.timeNavIn, {width: 0, autoAlpha: 1}, {width: this.origWidth, autoAlpha: 1});
        },

        aniOut: function () {
            var delay = (this.numNavItems - 1 - this.num) * common.timeNavStaggerOut;
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
