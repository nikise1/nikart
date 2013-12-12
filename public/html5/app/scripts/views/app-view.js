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

    var View = Backbone.View.extend({

        el: '#app',

        initialize: function () {
            this.timer = undefined;

            this.listenTo(vent, vent.ventInitDataLoaded, this.onInitDataLoaded);
            window.addEventListener('scroll', function(evt) {
                vent.trigger(vent.ventScrolling, evt);
                if(this.timer) {
                    clearTimeout(this.timer);
                }
                this.timer = setTimeout(function() {
                    vent.trigger(vent.ventScrollingStopped, evt);
                }, common.timeDelayScrollStopped * 1000);
            }, false);

            this.appModel = new AppModel();
        },

        onInitDataLoaded: function () {
            var view;
            view = new ArticleView({appModel: this.appModel});
            view = new VideoView({appModel: this.appModel});
            view = new ThumbView({appModel: this.appModel});
//            view = new BreadcrumbsView({appModel: this.appModel});
            view = new NavView({appModel: this.appModel});
        },

        setRouter: function (router) {
            this.appModel.setRouter(router);
        }
    });

    return View;
});
