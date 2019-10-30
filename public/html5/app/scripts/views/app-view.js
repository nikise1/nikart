/* global define */
define([
    'backbone',
    'common/common',
    'events/vent',
    'models/app-model',
    'views/article-view',
    'views/video-view',
    'views/thumb-view',
    'views/breadcrumbs-view',
    'views/nav-view'
], function (Backbone, common, vent, AppModel, ArticleView, VideoView, ThumbView, BreadcrumbsView, NavView) {
    'use strict';

    var that;

    return Backbone.View.extend({

        el: '#app',

        initialize: function () {
            that = this;
            this.listenTo(vent, vent.ventInitDataLoaded, this.onInitDataLoaded);
            that.model = new AppModel();
        },

        onInitDataLoaded: function () {
            var view;
            view = new ArticleView({appModel: that.model});
            view = new VideoView({appModel: that.model});
            view = new ThumbView({appModel: that.model});
            view = new BreadcrumbsView({appModel: that.model});
            view = new NavView({appModel: that.model});

            that.timer = undefined;
            window.addEventListener('scroll', function (evt) {
                vent.trigger(vent.ventScrolling, evt);
                if (that.timer) {
                    clearTimeout(that.timer);
                }
                that.timer = setTimeout(function () {
//                    console.log('----------------ventScrollingStopped--------------');
                    vent.trigger(vent.ventScrollingStopped, evt);
                }, common.timeDelayScrollStopped * 1000);
            }, false);

            window.addEventListener('resize', that.resizeApp, false);
            window.addEventListener('orientationchange', that.resizeApp, false);
            that.resizeApp();
        },

        setRouter: function (router) {
            that.model.setRouter(router);
        },

        resizeApp: function () { //(event)
            var newWidth = window.innerWidth;
            var newHeight = window.innerHeight;
            that.model.setNewDimensions(newWidth, newHeight);
//            console.log(that.model.get('screenCode') + ', ' + that.model.get('orientation') + ', ' + newWidth + 'x' + newHeight);
        }
    });
});
