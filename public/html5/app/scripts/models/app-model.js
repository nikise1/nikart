/* global define */
define([
    'backbone',
    'common/common',
    'events/vent',
    'models/json-model'
], function (Backbone, common, vent, JSONModel) {
    'use strict';

    var Model = Backbone.Model.extend({

        defaults: {
            thumbsToAnimateArr: []
        },

        curItem: undefined,
        jsonModel: undefined,
        pathArr: [],
        router: undefined,

        initialize: function () {
            var _this = this;
            var langCode = (window.nikart && window.nikart.langCode) ? window.nikart.langCode : 'en';
            common.setLang(langCode);

            this.listenTo(vent, vent.ventNavItemClicked, this.onNavItemClicked);
            this.listenTo(vent, vent.ventThumbItemClicked, this.onThumbItemClicked);

            this.jsonModel = new JSONModel();
            this.jsonModel.fetch({success: function () { //(model, response, options)
                _this.onInitDataLoaded();
            }});
        },

        onInitDataLoaded: function () {

            this.setCorrectMenu();
            vent.trigger(vent.ventInitDataLoaded);
        },

        setRouter: function (router) {
            this.router = router;
        },

        injectModelsAndColls: function (target) {
            target.jsonModel = this.jsonModel;
        },

        getNavItems: function () {
            return this.jsonModel.get('menu');
        },

        setCorrectMenu: function () {
            var curItemTemp = this.jsonModel.attributes;
            for (var i = 0; i < this.pathArr.length; i++) {
                curItemTemp = curItemTemp.menu[this.pathArr[i].num];
            }
            this.curItem = curItemTemp;
        },

        addToPath: function (num, id, title) {
            this.pathArr.push({num: num, id: id, title: title});
            this.setCorrectMenu();
            console.log('this.pathArr: ' + JSON.stringify(this.pathArr));
        },

        removeFromPath: function () {
            this.pathArr.pop();
            this.setCorrectMenu();
        },

        onNavItemClicked: function (idStr) {
            this.resetVars();
            vent.trigger(vent.ventNavClose);
            this.onItemClicked(idStr);
        },

        onThumbItemClicked: function (idStr) {
            if (!this.curItem) {
                this.resetVars();
            }
            vent.trigger(vent.ventThumbClose);
            this.onItemClicked(idStr);
        },

        resetVars: function () {
            this.pathArr = [];
            this.curItem = this.jsonModel.attributes;
        },

        onItemClicked: function (idStr) {

//            var curType;
//            curType = this.curItem.type;
//            console.log('before curType: ' + curType + ', ' + idStr);

            var curMenu = this.curItem.menu;
            for (var i = 0; i < curMenu.length; i += 1) {
                if (curMenu[i].id === idStr) {
                    this.addToPath(i, curMenu[i].id, common.getLangStr(curMenu[i], 'title'));
                    break;
                }
            }
            var curType = this.curItem.type;
//            console.log('after curType: ' + curType + ', ' + idStr);

            //TODO *** router deep linking and breadcrumbs ***
//            this.router.navigate(curMenu[i].id);

            vent.trigger(vent.ventPathUpdate);

//            'men','tex','web','vid','ima'
            switch (curType) {
            case 'men':
                vent.trigger(vent.ventThumbOpen, this.curItem);
                break;
            case 'tex':
            case 'web':
            case 'ima':
                vent.trigger(vent.ventArticleOpen, this.curItem);
                break;
            case 'vid':
                vent.trigger(vent.ventVideoOpen, this.curItem);
                break;
            }
        }
    });

    return Model;
});