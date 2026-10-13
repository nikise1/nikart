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

    return Backbone.View.extend({

        el: '.thumb-list',

        initialize: function () {
            this.appModel = this.options.appModel;
            this.appModel.injectModelsAndColls(this);

            this.openBool = false;
            this.thumbItemViewArr = [];
            this.timer = undefined;

            this.listenTo(vent, vent.ventThumbOpen, this.openThis);
            this.listenTo(vent, vent.ventThumbClose, this.closeThis);

            this.$el.css('right', -300);
        },

        render: function (curItem) {

            this.jsonMenu = curItem.menu;

            //*** Don't show link to own view html5 ***
            for (var i = this.jsonMenu.length - 1; i >= 0; i -= 1) {
                if (this.jsonMenu[i].id && this.jsonMenu[i].id === 'html5') {
                    this.jsonMenu.splice(i, 1);
                }
            }

            for (i = 0; i < this.jsonMenu.length; i += 1) {
                this.jsonMenu[i].title = common.getLangStr(this.jsonMenu[i], 'title');
                this.jsonMenu[i].num = i;
            }
            this.clearAllItems();
            this.addAll(this.jsonMenu);

            return this;
        },

        openThis: function (curItem) {
            this.curItem = curItem;
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
            var view = new ThumbItemView({ model: item, appModel: this.appModel });
            this.$el.append(view.render().el);
            this.thumbItemViewArr.push(view);
        },

        clearAllItems: function () {
            this.appModel.set({thumbsToAnimateArr: []});
            for (var i = ThumbCollection.models.length - 1; i >= 0; i -= 1) {
                var item = ThumbCollection.models[i];
                item.destroy();
                var view = this.thumbItemViewArr[i];
                this.thumbItemViewArr[i] = undefined;
                view.cleanUpDelayedCalls();
                view.remove();
            }
            this.thumbItemViewArr = [];
            return false;
        }
    });
});
