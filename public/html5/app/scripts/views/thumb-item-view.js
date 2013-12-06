/* global define */
define([
    'backbone',
    'underscore',
    'tweenlite',
    'common/common',
    'events/vent',
    'text!templates/thumb-item-template.html'
], function (Backbone, _, TweenLite, common, vent, thumbItemTemplate) {
    'use strict';

    var View = Backbone.View.extend({

        tagName: 'li',

        className: 'thumb-item-container',

        template: _.template(thumbItemTemplate),

        events: {
            'click .thumb-label': 'onItemClick',
            'click .thumb-img': 'onItemClick',
            'click .thumb-ani': 'onItemClick'
        },

        initialize: function () {
            this.appModel = this.options.appModel;
            this.appModel.injectModelsAndColls(this);

            this.timeRandomStop = 5;
            this.timeTillNextFrame = 0;
            this.curFrame = 1;
            this.numFrames = 10;
            this.timeTotalAni = common.timeAniFrame * this.numFrames;
            this.num = this.model.get('num');
            this.numDigits = 4;
            this.isPlaying = false;
            this.isGoingToOpen = false;
            this.isInView = false;
            this.followingFunc = undefined;
            this.delayedSequence = undefined;
            this.aniPrefix = 'anitest-fr-';
            this.aniAllFramesStr = '';
            for (var i = 0; i < this.numFrames; i++) {
                if (i !== 0) {
                    this.aniAllFramesStr += ' ';
                }
                this.aniAllFramesStr += this.aniPrefix + common.strWith0s(i + 1, this.numDigits);
            }
//            console.log('this.aniAllFramesStr: ||' + this.aniAllFramesStr + '||');

            this.listenTo(vent, vent.ventScrollingStopped, this.onScrollingStopped);
        },

        render: function () {

            this.$el.html(this.template(this.model.toJSON()));
            var url = common.urlImg() + '/' + this.model.id + '.jpg';
            var img = this.$el.find('img').get(0);
            img.src = url;

            this.$thumbLabel = this.$el.find('.thumb-label');
            this.$thumbLabel.css('cursor', 'pointer');
            this.$thumbImg = this.$el.find('.thumb-img');
            this.$thumbImg.css('cursor', 'pointer');
            this.$thumbAni = this.$el.find('.thumb-ani');
            this.$thumbAni.css('cursor', 'pointer');

            this.showFrame();
            this.isGoingToOpen = true;
            TweenLite.to(this.$thumbImg, 0, {scale: 0.5});
            TweenLite.delayedCall(common.timeDelayThumbIn + this.num * this.timeTotalAni / 2, this.checkIfNeedToOpen, [true], this);

            return this;
        },

        onScrollingStopped: function () {
            this.checkIfNeedToOpen(false);
        },

        checkIfNeedToOpen: function (shouldPlayImmediately) {
            var isScrolledIntoViewObj = this.isScrolledIntoView(this.el);
            if (!this.isInView && isScrolledIntoViewObj.half) {
                this.isInView = true;
                if (shouldPlayImmediately) {
                    this.playAni();
                } else {
                    var thumbsToAnimateArr = this.appModel.get('thumbsToAnimateArr');
                    if (!_.contains(thumbsToAnimateArr, this.num)) {
                        thumbsToAnimateArr.push(this.num);
                        if (this.delayedSequence) {
                            this.delayedSequence.kill();
                        }
                        console.log('thumbsToAnimateArr: ' + thumbsToAnimateArr);
                        this.delayedSequence = TweenLite.delayedCall((thumbsToAnimateArr.length - 1) * this.timeTotalAni / 2, this.playAni, null, this);
                    }
                }
            } else if (this.isInView && !isScrolledIntoViewObj.part) {
                this.resetAni();
            }
        },

        resetAni: function () {
            this.isInView = false;
            this.removeFromAnimateArr(this.num);
            this.showFrame(1);
            TweenLite.to(this.$thumbAni, 0, {opacity: 1});
            TweenLite.to(this.$thumbImg, 0, {scale: 0.5});
            this.isGoingToOpen = true;
        },

        removeFromAnimateArr: function (num) {
            var thumbsToAnimateArr = this.appModel.get('thumbsToAnimateArr');
            if (thumbsToAnimateArr.length > 0) {
                if (_.contains(thumbsToAnimateArr, num)) {
                    this.appModel.set({thumbsToAnimateArr: _.without(thumbsToAnimateArr, num)});
                    console.log('removed: ' + thumbsToAnimateArr);
                }
            }
        },

        playAni: function () {
            this.removeFromAnimateArr(this.num);
            if (this.isInView) {
                this.isPlaying = true;
                this.nextFrame();
            }
        },

        nextFrame: function () {
            if (this.isInView) {
                this.checkForImgAni();
                this.curFrame += 1;
                if (this.curFrame >= this.numFrames) {
                    this.isPlaying = false;
                } else {
                    this.followingFunc = this.nextFrame;
                    this.timeTillNextFrame = common.timeAniFrame;
                }
                this.doFrame();
            }
        },

        doFrame: function () {
            this.showFrame();
            if (this.isPlaying) {
                TweenLite.delayedCall(this.timeTillNextFrame, this.followingFunc, null, this);
            }
        },

        showFrame: function (newFrame) {
            if (newFrame) {
                this.curFrame = newFrame;
            }
            this.$thumbAni.removeClass(this.aniAllFramesStr);
            var classToAdd = this.aniPrefix + common.strWith0s(this.curFrame, this.numDigits);
            this.$thumbAni.addClass(classToAdd);
        },

        checkForImgAni: function () {
            if (this.isGoingToOpen) {
                this.isGoingToOpen = false;
                TweenLite.to(this.$thumbAni, this.timeTotalAni, {opacity: 0, ease: 'Quad.easeIn'});
                TweenLite.to(this.$thumbImg, this.timeTotalAni, {scale: 1, ease: 'Quad.easeIn'});
            }
        },

        isScrolledIntoView: function (elem) {
            var $window = $(window);
            var $elem = $(elem);
            var docViewTop = $window.scrollTop();
            var docViewBottom = docViewTop + $window.height();

            var elemTop = $elem.offset().top;
            var elemBottom = elemTop + $elem.height();
            var elemMid = (elemTop + elemBottom) / 2;

            var all = ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
            var half = ((elemMid <= docViewBottom) && (elemMid >= docViewTop));
            var part = ((elemTop <= docViewBottom) && (elemBottom >= docViewTop));
            return {all: all, half: half, part: part};
        },

        onItemClick: function () {
            vent.trigger(vent.ventThumbItemClicked, this.model.get('id'));
        }
    });

    return View;
});
