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
            this.appModel = this.options.appModel;
            this.appModel.injectModelsAndColls(this);

            this.openBool = false;
            this.thumbItemViewArr = [];
            this.timer = undefined;

            this.listenTo(vent, vent.ventThumbOpen, this.openThis);
            this.listenTo(vent, vent.ventThumbClose, this.closeThis);
//            this.listenTo(vent, vent.ventScrolling, this.onScrolling);
//            this.listenTo(vent, vent.ventScrollingStopped, this.onScrollingStopped);

            this.$el.css('right', -300);
//            this.$el.fadeTo(0, 0);
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

//        onScrolling: function () {
//            this.appModel.set({thumbsToAnimateArr: []});
//        },

//        onScrollingStopped: function () {
//            var that = this;
////            TweenLite.killDelayedCallsTo(this.onScrollingStoppedPollAll);
////            TweenLite.delayedCall(common.timeDelayScrollStoppedPoll, this.onScrollingStoppedPollAll, null, this);
//            if (this.timer) {
//                clearTimeout(this.timer);
//            }
//            this.timer = setTimeout(function () {
//                clearTimeout(this.timer);
//                that.onScrollingStoppedPollAll();
//            }, common.timeDelayScrollStoppedPoll);
//        },
//
//        onScrollingStoppedPollAll: function () {
//            var thumbsToAnimateArr = this.appModel.get('thumbsToAnimateArr');
//            console.log('thumbsToAnimateArr: ' + thumbsToAnimateArr);
//            var numInAni = 0;
//            for (var i = 0; i < this.thumbItemViewArr.length; i++) {
//                var thumbItemView = this.thumbItemViewArr[i];
//                for (var j = 0; j < thumbsToAnimateArr.length; j++) {
//                    console.log('thumbItemView.model.get(\'num\'): ' + thumbItemView.model.get('num'));
//                    console.log('thumbsToAnimateArr[j]: ' + thumbsToAnimateArr[j]);
//                    if (thumbItemView.model.get('num') === thumbsToAnimateArr[j]) {
//                        thumbItemView.playAni();
//                    }
//                }
//            }
//        },

        // Clear all items, destroying their models.
        clearAllItems: function () {
//            TweenLite.killDelayedCallsTo(this.onScrollingStoppedPollAll);
            this.thumbItemViewArr = [];
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
