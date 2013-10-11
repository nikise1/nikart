/* global define */
define([
    'backbone',
    'underscore',
    'tweenlite',
    'jplayer',
    'common/common',
    'events/vent',
    'text!templates/video-template.html'
], function (Backbone, _, TweenLite, jPlayer, common, vent, videoTemplate) {
    'use strict';

    var View = Backbone.View.extend({

        el: '.content-container',

        initialize: function () {
            this.listenTo(vent, vent.ventVideoOpen, this.videoOpen);
            this.listenTo(vent, vent.ventVideoClose, this.videoClose);
        },

        render: function () {
            var self = this;
            this.template = _.template(videoTemplate);
            var data = {
                title: this.curItem.title
            };
            this.$el.html(this.template(data));


            var videoWidthSm = 393;
            var videoHeightSm = 288;
            var vidH264URL = common.urlVideoH264() + '/' + this.curItem.id + '.mp4';
            var vidWebmURL = common.urlVideoWebm() + '/' + this.curItem.id + '.webm';
            var posterURL = common.urlImg() + '/' + this.curItem.id + '.jpg';

            this.$player = $('.jp-jplayer');
            $('#jplayer_interactive').jPlayer({
                ready: function () {
                    $(this).jPlayer('setMedia', {
                        m4v: vidH264URL,
                        webmv: vidWebmURL,
                        poster: posterURL
                    });

                },
                //TODO *** possibly fix the swfPath ***
//                swfPath: 'bower_components/jplayer/jquery.jplayer',
                swfPath: '',
//                solution: 'flash',
                supplied: 'webmv, m4v',
//                supplied: 'webmv',
//                supplied: 'm4v',
                cssSelectorAncestor: '#jp_container',
                size: {
                    width: videoWidthSm + 'px',
                    height: videoHeightSm + 'px'
                },
                loop: false
            });

            $('#jplayer_interactive').bind($.jPlayer.event.resize, function () { //(event)
                var isFullScreen = self.$player.jPlayer('option', 'fullScreen');
                console.log('isFullScreen: ' + isFullScreen);
                if (isFullScreen) {
                    self.$player.jPlayer('play');
                }
            });

            $('#jplayer_interactive').bind($.jPlayer.event.error, function (event) {
//                console.log('event.jPlayer.error: ' + event.jPlayer.error);
                console.log('event.jPlayer.error.type: ' + event.jPlayer.error.type);
                console.log('event.jPlayer.error.context: ' + event.jPlayer.error.context);
                console.log('event.jPlayer.error.message: ' + event.jPlayer.error.message);
                console.log('event.jPlayer.error.hint: ' + event.jPlayer.error.hint);
            });


            return this;
        },

        clearAll: function () {
            this.$el.empty();
            this.template = undefined;
            console.log('clearAll: ' + this.$el.html());
        },

        videoOpen: function (curItem) {
            this.curItem = curItem;
            console.log('videoOpen: ' + this.curItem.id);
            this.render();
            TweenLite.fromTo(this.$el, common.timeArticleIn, {autoAlpha: 0}, {autoAlpha: 1});
        },

        videoClose: function () {
            if (this.template) {
                console.log('videoClose');
                if (this.$player && this.$player.jPlayer) {
                    this.$player.jPlayer('pause');
                }
                TweenLite.to(this.$el, common.timeArticleOut, {autoAlpha: 0, onComplete: this.clearAll, onCompleteScope: this});
            }
        }
    });

    return View;
});
