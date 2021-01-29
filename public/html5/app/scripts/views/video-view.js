/* global define */
define([
    'backbone',
    'underscore',
    'tweenlite',
    'common/common',
    'events/vent',
    'text!templates/video-template.html'
], function (Backbone, _, TweenLite, common, vent, videoTemplate) {
    'use strict';

    var View = Backbone.View.extend({

        el: '.content-container',

        initialize: function () {
            this.appModel = this.options.appModel;
            this.appModel.injectModelsAndColls(this);

            this.listenTo(vent, vent.ventVideoOpen, this.videoOpen);
            this.listenTo(vent, vent.ventVideoClose, this.videoClose);
        },

        render: function () {
            // var self = this;
            this.template = _.template(videoTemplate);
            var data = {
                title: this.curItem.title
            };
            this.$el.html(this.template(data));

            this.$titleVid = $('.title-vid');

            // var videoWidthSm = 393;
            // var videoHeightSm = 288;
            // var vidH264URL = common.urlVideoH264() + '/' + this.curItem.id + '.mp4';
            // var vidWebmURL = common.urlVideoWebm() + '/' + this.curItem.id + '.webm';
            // var posterURL = common.urlImg() + '/' + this.curItem.id + '.jpg';

//             this.$player = $('.jp-jplayer');
//             $('#jplayer_interactive').jPlayer({
//                 ready: function () {
//                     $(this).jPlayer('setMedia', {
//                         m4v: vidH264URL,
//                         webmv: vidWebmURL,
//                         poster: posterURL
//                     });

//                 },
//                 //TODO *** possibly fix the swfPath ***
// //                swfPath: 'bower_components/jplayer/jquery.jplayer',
//                 swfPath: '',
// //                solution: 'flash',
//                 supplied: 'webmv, m4v',
// //                supplied: 'webmv',
// //                supplied: 'm4v',
//                 cssSelectorAncestor: '#jp_container',
//                 size: {
//                     width: videoWidthSm + 'px',
//                     height: videoHeightSm + 'px'
//                 },
//                 loop: false
//             });

//             $('#jplayer_interactive').bind($.jPlayer.event.resize, function () { //(event)
//                 var isFullScreen = self.$player.jPlayer('option', 'fullScreen');
// //                console.log('isFullScreen: ' + isFullScreen);
//                 if (isFullScreen) {
//                     self.$player.jPlayer('play');
//                 }
//             });

//             $('#jplayer_interactive').bind($.jPlayer.event.error, function (event) {
// //                console.log('event.jPlayer.error: ' + event.jPlayer.error);
//                 console.log('event.jPlayer.error.type: ' + event.jPlayer.error.type);
//                 console.log('event.jPlayer.error.context: ' + event.jPlayer.error.context);
//                 console.log('event.jPlayer.error.message: ' + event.jPlayer.error.message);
//                 console.log('event.jPlayer.error.hint: ' + event.jPlayer.error.hint);
//             });

            this.resizeApp();
            this.listenTo(this.appModel, 'change:totalWidth change:totalHeight', this.resizeApp);

            return this;
        },

        clearAll: function () {
            this.$el.empty();
            this.template = undefined;
            //            console.log('clearAll: ' + this.$el.html());
        },

        videoOpen: function (curItem) {
            this.curItem = curItem;
            //            console.log('videoOpen: ' + this.curItem.id);
            this.render();

            var myPlayer = window.videojs('my-video');
            var vidH264URL = common.urlVideoH264() + '/' + this.curItem.id + '.mp4';
            myPlayer.src({type: 'video/mp4', src: vidH264URL});

            TweenLite.fromTo(this.$el, common.timeArticleIn, { autoAlpha: 0 }, { autoAlpha: 1 });
        },

        videoClose: function () {
            if (this.template) {
                //                console.log('videoClose');
                // if (this.$player && this.$player.jPlayer) {
                //     this.$player.jPlayer('pause');
                // }
                TweenLite.to(this.$el, common.timeArticleOut, { autoAlpha: 0, onComplete: this.clearAll, onCompleteScope: this });
            }
        },

        resizeApp: function () { //(event)
            var screenCode = this.appModel.get('screenCode');
            var orientation = this.appModel.get('orientation');
            if (screenCode === 'ty' && orientation === 'portrait') {
                this.$titleVid.css('text-align', 'right');
                this.$titleVid.css('margin-left', '7em');
            } else {
                this.$titleVid.css('text-align', 'center');
                if (screenCode === 'ty') {
                    this.$titleVid.css('margin-left', '2em');
                } else {
                    this.$titleVid.css('margin-left', 0);
                }
            }
        }
    });

    return View;
});
