/* global define */
define([
    'backbone',
    'events/vent',
    'models/app-model',
    'views/article-view',
    'views/video-view',
    'views/thumb-view',
    'views/breadcrumbs-view',
    'views/nav-view'
], function (Backbone, vent, AppModel, ArticleView, VideoView, ThumbView, BreadcrumbsView, NavView) {
    'use strict';

    var View = Backbone.View.extend({

        el: '#app',

        initialize: function () {
            this.listenTo(vent, vent.ventInitDataLoaded, this.onInitDataLoaded);
            this.appModel = new AppModel();
        },

        onInitDataLoaded: function () {
            var view;
            view = new ArticleView({model: this.appModel});
            view = new VideoView({model: this.appModel});
            view = new ThumbView({model: this.appModel});
//            view = new BreadcrumbsView({model: this.appModel});
            view = new NavView({model: this.appModel});
        },

        setRouter: function (router) {
            this.appModel.setRouter(router);
        }
    });

    return View;
});
