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
            this.isPlaying = false;
            this.followingFunc = undefined;
            this.aniPrefix = 'anitest-fr-000';
            this.aniAllFramesStr = '';
            for (var i = 0; i < this.numFrames; i++) {
                if (i !== 0) {
                    this.aniAllFramesStr += ' ';
                }
                this.aniAllFramesStr += this.aniPrefix + (i + 1);
            }
//            console.log('this.aniAllFramesStr: ||' + this.aniAllFramesStr + '||');
        },

        render: function () {

            this.$el.html(this.template(this.model.toJSON()));
            var url = common.urlImg() + '/' + this.model.id + '.jpg';
            var img = this.$el.find('img')[0];
            img.src = url;

            this.$thumbLabel = this.$el.find('.thumb-label');
            this.$thumbLabel.css('cursor', 'pointer');
            this.$thumbImg = this.$el.find('.thumb-img');
            this.$thumbImg.css('cursor', 'pointer');
            this.$thumbAni = this.$el.find('.thumb-ani');
            this.$thumbAni.css('cursor', 'pointer');

            this.showFrame();
            this.playAni();

            return this;
        },

        showFrame: function (newFrame) {
            if (newFrame) {
                this.curFrame = newFrame;
            }
            this.$thumbAni.removeClass(this.aniAllFramesStr);
            this.$thumbAni.addClass(this.aniPrefix + this.curFrame);
        },

        playAni: function () {
            this.isPlaying = true;
            this.nextFrame();
        },

        nextFrame: function () {
            this.followingFunc = this.nextFrame;
            this.timeTillNextFrame = common.timeAniFrame;
            this.curFrame += 1;
            if (this.curFrame > this.numFrames) {
//                this.curFrame = 1;
                this.curFrame -= 2;
                this.followingFunc = this.prevFrame;
                TweenLite.to(this.$thumbImg, common.timeAniFrame * this.numFrames / 2, {scale: 1, ease: 'Quad.easeIn'});
                this.timeTillNextFrame = this.timeTillNextFrame + Math.random() * this.timeRandomStop;
            }
            this.doFrame();
        },

        prevFrame: function () {
            this.followingFunc = this.prevFrame;
            this.timeTillNextFrame = common.timeAniFrame;
            this.curFrame -= 1;
            if (this.curFrame < 1) {
//                this.curFrame = this.numFrames;
                this.curFrame = 2;
                TweenLite.to(this.$thumbImg, common.timeAniFrame * this.numFrames / 2, {scale: 0.5, ease: 'Quad.easeOut'});
                this.followingFunc = this.nextFrame;
//                this.timeTillNextFrame = this.timeTillNextFrame + Math.random() * this.timeRandomStop;
            }
            this.doFrame();
        },

        doFrame: function () {

            this.showFrame();
            if (this.isPlaying) {
                TweenLite.delayedCall(this.timeTillNextFrame, this.followingFunc, null, this);
            }
        },

        onItemClick: function () {
            vent.trigger(vent.ventThumbItemClicked, this.model.get('id'));
        }
    });

    return View;
});
