/* global define */
define([
    'backbone',
    'tweenlite',
    'common/common',
    'events/vent',
    'collections/nav-collection',
    'views/nav-item-view'
], function (Backbone, TweenLite, common, vent, NavCollection, NavItemView) {
    'use strict';

    var View = Backbone.View.extend({

        el: '.nav-container',

        events: {
            'click .nav-btn-container': 'toggle'
        },

        initialize: function () {

            this.openBool = true;
            this.initDone = false;

            this.listenTo(vent, vent.ventNavOpen, this.openThis);
            this.listenTo(vent, vent.ventNavClose, this.closeThis);

            this.jsonNav = this.model.getNavItems();
            this.numNavItems = this.jsonNav.length;

            for (var i = 0; i < this.numNavItems; i += 1) {
                this.jsonNav[i].title = common.getLangStr(this.jsonNav[i], 'title');
            }

            this.$navItemsContainer = $('.nav-items-container');
            this.$navItemsContainer.hide();

            this.addAll(this.jsonNav);

            TweenLite.delayedCall(common.timeNavIn, this.readyForOpening, [], this);
        },

        readyForOpening: function () {
            this.initDone = true;
            $('.nav-btn-container').css('cursor', 'pointer');
            this.doAni();
        },

        toggle: function () {
            if (this.initDone) {
                this.openBool = !this.openBool;
                if (this.openBool) {
                    vent.trigger(vent.ventThumbClose);
                    vent.trigger(vent.ventArticleClose);
                    vent.trigger(vent.ventVideoClose);
                }
                this.doAni();
            }
        },

        openThis: function () {
            this.openBool = true;
            this.doAni();
        },

        closeThis: function () {
            this.openBool = false;
            this.doAni();
        },

        doAni: function () {
            var i, navItemView;

            TweenLite.killDelayedCallsTo(this.doAni);
            TweenLite.killDelayedCallsTo(this.doneAniOut);

            for (i = 0; i < this.numNavItems; i++) {
                navItemView = this.navItemViewArr[i];
                navItemView.removeTweensAndDelays();
            }

            if (this.openBool) {
                this.$navItemsContainer.show();
            } else {
                TweenLite.delayedCall(common.timeNavOut + (this.numNavItems - 1) * common.timeNavStaggerOut, this.doneAniOut, [], this);
            }
            for (i = 0; i < this.numNavItems; i++) {
                navItemView = this.navItemViewArr[i];
                if (this.openBool) {
                    navItemView.aniIn(i * common.timeNavStaggerIn);
                } else {
                    navItemView.aniOut((this.numNavItems - 1 - i) * common.timeNavStaggerOut);
                }
            }
        },

        doneAniOut: function () {
            this.$navItemsContainer.hide();
        },

        addAll: function (arr) {
            this.navItemViewArr = [];
            NavCollection.add(arr);
            this.$navItemsContainer.html('');
            this.$navItemsContainer.hide();
            NavCollection.each(this.addOne, this);
        },

        addOne: function (item) {
            var view = new NavItemView({ model: item });
            var curEl = view.render().el;
            this.$navItemsContainer.append(curEl);
            this.navItemViewArr.push(view);
        }
    });

    return View;
});
