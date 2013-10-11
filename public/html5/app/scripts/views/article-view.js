/* global define */
define([
    'backbone',
    'underscore',
    'tweenlite',
    'common/common',
    'events/vent',
    'text!templates/article-template.html',
    'utils/slideshow'
], function (Backbone, _, TweenLite, common, vent, articleTemplate, slideshow) {
    'use strict';

    var View = Backbone.View.extend({

        el: '.content-container',

        initialize: function () {
            this.listenTo(vent, vent.ventArticleOpen, this.articleOpen);
            this.listenTo(vent, vent.ventArticleClose, this.articleClose);
        },

        render: function () {
            this.template = _.template(articleTemplate);
            this.urlImgArr = [];
            for (var i = 0; i < this.curItem.imgs; i++) {
                var tmpURL = common.urlImg() + '/' + this.curItem.id + '_' + (i + 1) + '.jpg';
                this.urlImgArr.push(tmpURL);
            }
            console.log('this.urlImgArr.length: ' + this.urlImgArr.length);

            var urlProcessed = common.processURL(common.getLangStr(this.curItem, 'url'));
            console.log('urlProcessed.urlLink: ' + urlProcessed.urlLink);
            console.log('urlProcessed.isSelf: ' + urlProcessed.isSelf);

            var data = {
                title: this.curItem.title,
                imgsrc: this.urlImgArr.shift(),
                desc: common.getLangStr(this.curItem, 'desc'),
                url: urlProcessed.urlLink,
                isSelf: urlProcessed.isSelf,
                launch: common.getLangStr(this.curItem, 'launch')
            };
            this.$el.html(this.template(data));

            var maxHeight = (this.curItem.type === 'ima') ? common.maxHeightImg : common.maxHeightTxtWeb;
            $('.article-img-container').css('height', maxHeight);

            this.$articleContent = $('.article-content');
            var articleHeight = this.$articleContent.outerHeight();
            console.log('articleHeight: ' + articleHeight);
            this.$articleContent.css('margin-top', -articleHeight / 2);

            console.log('this.urlImgArr.length: ' + this.urlImgArr.length);

            slideshow.init('article-img', 1.25, 0.4, this.urlImgArr, 'article-img');

            return this;
        },

        clearAll: function () {
            slideshow.pause();
            this.$el.empty();
            this.template = undefined;
            console.log('clearAll: ' + this.$el.html());
        },

        articleOpen: function (curItem) {
            this.curItem = curItem;
//            console.log('articleOpen: ' + this.curItem.id);
            this.render();
            TweenLite.fromTo(this.$el, common.timeArticleIn, {autoAlpha: 0}, {autoAlpha: 1});
        },

        articleClose: function () {
            if (this.template) {
                console.log('articleClose');
                TweenLite.to(this.$el, common.timeArticleOut, {autoAlpha: 0, onComplete: this.clearAll, onCompleteScope: this});
            }
        }
    });

    return View;
});
