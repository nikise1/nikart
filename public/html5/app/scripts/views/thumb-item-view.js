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
            this.timeRandomStop = 5;
            this.timeTillNextFrame = 0;
            this.curFrame = 1;
            this.numFrames = 10;
            this.numDigits = 4;
            this.isGoingToOpen = false;
            this.isGoingToClose = false;
            this.followingFunc = undefined;
            this.aniPrefix = 'anitest-fr-';
            this.aniAllFramesStr = '';
            for (var i = 0; i < this.numFrames; i++) {
                if (i !== 0) {
                    this.aniAllFramesStr += ' ';
                }
                this.aniAllFramesStr += this.aniPrefix + common.strWith0s(i + 1, this.numDigits);
            }
//            console.log('common.strWith0s(15, 7): ' + common.strWith0s(15, 7));
//            console.log('this.aniAllFramesStr: ||' + this.aniAllFramesStr + '||');
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
            this.playAni();

            return this;
        },

        playAni: function () {
            this.nextFrame();
        },

        nextFrame: function () {
            this.checkForImgAni();
            if (this.curFrame < this.numFrames) {
                this.curFrame += 1;
                this.followingFunc = this.nextFrame;
                this.timeTillNextFrame = common.timeAniFrame;
            } else {
                this.isGoingToClose = true;
                this.followingFunc = this.prevFrame;
                this.timeTillNextFrame = this.timeTillNextFrame + Math.random() * this.timeRandomStop;
            }
            this.doFrame();
        },

        prevFrame: function () {
            this.checkForImgAni();
            if (this.curFrame > 1) {
                this.curFrame -= 1;
                this.followingFunc = this.prevFrame;
                this.timeTillNextFrame = common.timeAniFrame;
            } else {
                this.isGoingToOpen = true;
                this.followingFunc = this.nextFrame;
                this.timeTillNextFrame = this.timeTillNextFrame + Math.random() * this.timeRandomStop;
            }
            this.doFrame();
        },

        doFrame: function () {
            this.showFrame();
            TweenLite.delayedCall(this.timeTillNextFrame, this.followingFunc, null, this);
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
                TweenLite.to(this.$thumbImg, common.timeAniFrame * this.numFrames, {scale: 1, ease: 'Quad.easeIn'});
            } else if (this.isGoingToClose) {
                this.isGoingToClose = false;
                TweenLite.to(this.$thumbImg, common.timeAniFrame * this.numFrames, {scale: 0.5, ease: 'Quad.easeOut'});
            }
        },

        onItemClick: function () {
            vent.trigger(vent.ventThumbItemClicked, this.model.get('id'));
        }
    });

    return View;
});
