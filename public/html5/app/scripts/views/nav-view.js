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
            this.appModel = this.options.appModel;
            this.appModel.injectModelsAndColls(this);

            this.openBool = true;
            this.initDone = false;

            this.listenTo(vent, vent.ventNavOpen, this.openThis);
            this.listenTo(vent, vent.ventNavClose, this.closeThis);

            this.jsonNav = this.appModel.getNavItems();
            this.numNavItems = this.jsonNav.length;

            for (var i = 0; i < this.numNavItems; i += 1) {
                this.jsonNav[i].title = common.getLangStr(this.jsonNav[i], 'title');
            }

            this.$navBtnContainer = $('.nav-btn-container');
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

                //*** canvas ani ***
                this.setUpCanvas();
            } else {
                var aniOutDelay = common.timeNavOut + (this.numNavItems - 1) * common.timeNavStaggerOut;
                TweenLite.delayedCall(aniOutDelay, this.doneAniOut, null, this);
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

        //*** canvas ani ***
        setUpCanvas: function () {
            this.$navCanvas = $('.nav-canvas');
            this.navCanvas = this.$navCanvas.get(0);
            this.cntxt = this.navCanvas.getContext('2d');
            this.cntxt.imageSmoothingEnabled = true;
            this.cntxt.clearRect(0, 0, this.navCanvas.width, this.navCanvas.height);

            var dTX = 30;
            var dTY = 10;
            var dBX = 117;
            var dBY = 258;
            var thickT = 18;
            var thickB = 6;
            var halfT = thickT / 2;
            var halfB = thickB / 2;

            this.cntxt.beginPath();
            this.cntxt.moveTo(dTX + halfT, 0);
            this.cntxt.bezierCurveTo(100, 50, 110, 110, dBX + halfB, dBY - halfB);
            this.cntxt.quadraticCurveTo(dBX, dBY + halfB, dBX - halfB, dBY - halfB);
            this.cntxt.bezierCurveTo(90, 60, 50, 45, 40, dTY + halfT);

            this.cntxt.closePath();
            this.cntxt.lineWidth = 1;
            this.cntxt.strokeStyle = common.colourDiffDark;
            this.cntxt.fillStyle = common.colourDiffDark;
//            this.cntxt.fillStyle = common.colourLight;
            this.cntxt.fill();
            this.cntxt.lineCap = 'round';
            this.cntxt.lineJoin = 'round';

            this.cntxt.stroke();

            TweenLite.fromTo(this.$navCanvas, common.timeNavGrowIn, {left: -75, top: -(this.$navCanvas.outerHeight() - 40)}, {left: 0, top: 0});
            TweenLite.to(this.$navBtnContainer, common.timeNavGrowIn, {left: -this.$navBtnContainer.outerWidth(), top: -this.$navBtnContainer.outerHeight()});
        },

        //*** canvas ani ***
        closeCanvas: function () {
            TweenLite.to(this.$navCanvas, common.timeNavGrowOut, {left: -75, top: -(this.$navCanvas.outerHeight() - 40), onComplete: this.clearCanvas, onCompleteScope: this});
            TweenLite.to(this.$navBtnContainer, common.timeNavGrowIn, {left: 0, top: 0});
        },

        //*** canvas ani ***
        clearCanvas: function () {
            this.cntxt.clearRect(0, 0, this.navCanvas.width, this.navCanvas.height);
        },

        doneAniOut: function () {
            this.$navItemsContainer.hide();

            //*** canvas ani ***
            this.closeCanvas();
//            this.clearCanvas();
        },

        addAll: function (arr) {
            this.navItemViewArr = [];
            NavCollection.add(arr);
            this.$navItemsContainer.html('');
            this.$navItemsContainer.hide();
            NavCollection.each(this.addOne, this);
        },

        addOne: function (item) {
            var view = new NavItemView({ model: item, appModel: this.appModel, num: this.navItemViewArr.length, numNavItems: NavCollection.length });
            var curEl = view.render().el;
            this.$navItemsContainer.append(curEl);
            this.navItemViewArr.push(view);
        }
    });

    return View;
});
