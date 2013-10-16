/* global define */
define([
    'backbone',
    'tweenlite',
    'common/common',
    'events/vent',
    'collections/thumb-collection',
    'views/thumb-item-view'
], function (Backbone, TweenLite, common, vent, ThumbCollection, ThumbItemView) {
    'use strict';

    var View = Backbone.View.extend({

        el: '.thumb-list',

        events: {
//            'click .nav-btn-container': 'toggleNav'
        },

        initialize: function () {

            this.openBool = false;

            this.listenTo(vent, vent.ventThumbOpen, this.openThis);
            this.listenTo(vent, vent.ventThumbClose, this.closeThis);

            this.$el.css('right', -300);
            this.$el.fadeTo(0, 0);
        },

        render: function (curItem) {

            this.jsonMenu = curItem.menu;


            //*** Don't show link to own view html5 ***
            for (var i = this.jsonMenu.length - 1; i >= 0; i -= 1) {
                if (this.jsonMenu[i].id && this.jsonMenu[i].id === 'html5') {
                    this.jsonMenu.splice(i, 1);
                }
            }
//            console.log('this.jsonMenu: ' + JSON.stringify(this.jsonMenu));


            for (i = 0; i < this.jsonMenu.length; i += 1) {
                this.jsonMenu[i].title = common.getLangStr(this.jsonMenu[i], 'title');
            }
            this.clearAllItems();
            this.addAll(this.jsonMenu);

            return this;
        },

        openThis: function (curItem) {
            this.curItem = curItem;
//            console.log('thumb-view curItem: ' + this.curItem);
            this.openBool = true;
            TweenLite.delayedCall(common.timeDelayThumbIn, this.doAni, [], this);
        },

        closeThis: function () {
            this.openBool = false;
            this.doAni();
        },

        doAni: function () {

            TweenLite.killDelayedCallsTo(this.doAni);
            TweenLite.killTweensOf(this.$el);
            if (this.openBool) {
                this.render(this.curItem);
                this.$el.fadeTo(0, 1);
                TweenLite.to(this.$el, common.timeThumbIn, {right: 0});
            } else {
                TweenLite.to(this.$el, common.timeThumbOut, {right: -300, onComplete: this.clearAllItems, onCompleteScope: this});
            }
        },

        doneAniOut: function () {
            this.$navItemsContainer.hide();
        },

        addAll: function (arr) {
            ThumbCollection.add(arr);
            ThumbCollection.each(this.addOne, this);
        },

        addOne: function (item) {
            var view = new ThumbItemView({ model: item });
            this.$el.append(view.render().el);
        },

        // Clear all items, destroying their models.
        clearAllItems: function () {
//            console.log('clearAllItems');
            for (this.i = ThumbCollection.models.length - 1; this.i >= 0; this.i -= 1) {
                var item = ThumbCollection.models[this.i];
                item.destroy();
            }
            this.$el.html('');
            return false;
        }
    });

    return View;
});
