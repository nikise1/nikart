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
                this.seUpCanvas();
            } else {
                TweenLite.delayedCall(common.timeNavOut + (this.numNavItems - 1) * common.timeNavStaggerOut, this.doneAniOut, null, this);
                this.closeCanvas();
            }
            for (i = 0; i < this.numNavItems; i++) {
                navItemView = this.navItemViewArr[i];
                if (this.openBool) {
                    navItemView.aniIn(i, this.numNavItems);
                } else {
                    navItemView.aniOut(i, this.numNavItems);
                }
            }
        },

        seUpCanvas: function () {
            this.$navCanvas = $('.nav-canvas');
            this.navCanvas = this.$navCanvas.get(0);
            this.cntxt = this.navCanvas.getContext('2d');
            this.cntxt.clearRect(0, 0, this.navCanvas.width, this.navCanvas.height)

            var dTX = 25;
            var dTY = 0;
            var dBX = 115;
            var dBY = 245;
            var thickT = 90;
            var thickB = 10;
            var halfT = thickT / 2;
            var halfB = thickB / 2;

            this.cntxt.beginPath();
            this.cntxt.moveTo(dTX + halfT, 0);
            this.cntxt.bezierCurveTo(105, 20, 120, 120, dBX + halfB, dBY - halfB);
            this.cntxt.quadraticCurveTo(dBX, dBY + halfB, dBX - halfB, dBY - halfB);
            this.cntxt.bezierCurveTo(80, 80, 50, 50, 0, dTY + halfT);

            this.cntxt.closePath();
            this.cntxt.lineWidth = 1;
            this.cntxt.fillStyle = common.colourMid;
//            this.cntxt.fillStyle = common.colourLight;
            this.cntxt.fill();
            this.cntxt.strokeStyle = common.colourMid;
            this.cntxt.lineCap = 'round';
            this.cntxt.lineJoin = 'round';

            this.cntxt.stroke();

            TweenLite.fromTo(this.$navCanvas, common.timeNavGrowIn, {left: -80, top: -(this.$navCanvas.outerHeight() - 40)}, {left: 0, top: 0});
        },

        closeCanvas: function () {
            TweenLite.to(this.$navCanvas, common.timeNavGrowOut, {left: -80, top: -(this.$navCanvas.outerHeight() - 40), onComplete: this.clearCanvas, onCompleteScope: this});
        },

        clearCanvas: function () {
            this.cntxt.clearRect(0, 0, this.navCanvas.width, this.navCanvas.height);
        },

        doneAniOut: function () {
            this.$navItemsContainer.hide();
            this.clearCanvas();
        },

        addAll: function (arr) {
            this.navItemViewArr = [];
            NavCollection.add(arr);
            this.$navItemsContainer.html('');
            this.$navItemsContainer.hide();
            NavCollection.each(this.addOne, this);
        },

        addOne: function (item) {
            var view = new NavItemView({ model: item, num: this.navItemViewArr.length, numNavItems: NavCollection.length });
            var curEl = view.render().el;
            this.$navItemsContainer.append(curEl);
            this.navItemViewArr.push(view);
        }
    });

    return View;
});
