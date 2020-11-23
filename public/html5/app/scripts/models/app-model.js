/* global define */
define([
    'backbone',
    'common/common',
    'events/vent',
    'models/json-model'
], function (Backbone, common, vent, JSONModel) {
    'use strict';

    var $html;

    var Model = Backbone.Model.extend({

        defaults: {
            thumbsToAnimateArr: [],

            // Extra small screen / phone (-1 is ty max)
            screenXs: 600,
            // Small screen / tablet
            screenSm: 768,
            // Medium screen / desktop
            screenMd: 992,
            // Large screen / wide desktop
            screenLg: 1200,
            // So media queries don't overlap when required, calculated below
            screenTyMax: 0,
            screenXsMax: 0,
            screenSmMax: 0,
            screenMdMax: 0,
            screenCode: '',
            orientation: ''
        },

        curItem: undefined,
        isFeaturedMenu: false,
        jsonModel: undefined,
        pathArr: [],
        router: undefined,

        initialize: function () {
            var _this = this;
            var langCode = (window.nikart && window.nikart.langCode) ? window.nikart.langCode : 'en';
            common.setLang(langCode);

            if (this.get('screenXsMax') === 0) {
                this.set({
                    screenTyMax: this.get('screenXs') - 1,
                    screenXsMax: this.get('screenSm') - 1,
                    screenSmMax: this.get('screenMd') - 1,
                    screenMdMax: this.get('screenLg') - 1
                });
            }
            $html = $('html');

            console.log('appModel - initialize - listenTo ventRouterUpdated');
            this.listenTo(vent, vent.ventRouterUpdated, this.onRouterUpdated);

            this.jsonModel = new JSONModel();
            this.jsonModel.fetch({
                success: function () { //(model, response, options)
                    _this.onInitDataLoaded();
                }
            });
        },

        onInitDataLoaded: function () {
            this.setCorrectMenu();
            vent.trigger(vent.ventInitDataLoaded);
            Backbone.history.start();
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

        addToPath: function (pathEntry) {
            this.pathArr.push(pathEntry);
            this.setCorrectMenu();
            console.log('addToPath - this.pathArr: ' + JSON.stringify(this.pathArr));
        },

        removeFromPath: function () {
            this.pathArr.pop();
            this.setCorrectMenu();
        },

        resetVars: function () {
            this.pathArr = [];
            this.curItem = this.jsonModel.attributes;
        },

        setCurItem: function (idStr) {
            this.resetVars();
            this.setIsFeaturedMenu(idStr);
            var result = this.findItem(idStr, this.curItem, []) || [];
            console.log('setCurItem - this.pathArr: ' + JSON.stringify(result));
            for (var i = 0; i < result.length; i += 1) {
                var path = result[i];
                this.addToPath(path);
            }
        },

        setIsFeaturedMenu: function (idStr) {
            const isDestinationMain = idStr === 'main' || idStr === '';
            if (isDestinationMain) {
                this.isFeaturedMenu = false;
            }
            const isFeaturedClick = idStr === 'featured';
            if (isFeaturedClick) {
                this.isFeaturedMenu = true;
            }
        },

        pathContainsFeatured: function (idStr, pathArr) {
            const result = idStr === 'featured' ||
                pathArr
                    .map(function (path) { return path.id; })
                    .includes('featured');
            return result;
        },

        findItem: function (idStr, menuItem, path) {
            var pathEntry;
            if (menuItem) {
                var found = menuItem.id === idStr;
                const skipFound = found && this.pathContainsFeatured(idStr, path) && !this.isFeaturedMenu;
                if (skipFound) {
                    found = undefined;
                } else if (found) {
                    console.log('findItem - found! ' + menuItem.id + ', path: ' + JSON.stringify(path));
                    return path;
                } else if (menuItem.menu) {
                    for (var i = 0; i < menuItem.menu.length; i += 1) {
                        var subMenuItem = menuItem.menu[i];
                        pathEntry = { num: i, id: subMenuItem.id, title: common.getLangStr(subMenuItem, 'title') };
                        var tempPath = path.concat([pathEntry]);
                        // console.log('findItem - ' + subMenuItem.id + ' not found but menu, tempPath: ' + JSON.stringify(tempPath));
                        var result = this.findItem(idStr, subMenuItem, tempPath);
                        if (result) {
                            return result;
                        }
                    }
                }
            }
            // console.log('findItem - idStr: ' + idStr + ' this.pathArr: ' + JSON.stringify(this.pathArr));
        },

        onRouterUpdated: function (idStr) {
            vent.trigger(vent.ventNavClose);
            vent.trigger(vent.ventThumbClose);
            vent.trigger(vent.ventArticleClose);
            vent.trigger(vent.ventVideoClose);
            console.log(
                'onItemClicked - before curType: ' +
                (this.curItem ? this.curItem.type : undefined) +
                ', ' +
                idStr
            );
            this.setCurItem(idStr);
            console.log('onItemClicked - after curType: ' + this.curItem.type + ', ' + idStr);
            vent.trigger(vent.ventPathUpdate);
            switch (this.curItem.type) {
            case 'main':
                vent.trigger(vent.ventNavOpen, this.curItem);
                break;
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
        },

        setNewDimensions: function (newWidth, newHeight) {
            this.set({
                totalWidth: newWidth,
                totalHeight: newHeight,
                screenCode: this.calculateScreenCode(newWidth),
                orientation: this.calculateOrientation(newWidth, newHeight)
            });
        },

        calculateScreenCode: function (newWidth) {
            var newCode = '';
            if (newWidth >= this.get('screenLg')) {
                newCode = 'lg';
            } else if (newWidth >= this.get('screenMd') && newWidth <= this.get('screenMdMax')) {
                newCode = 'md';
            } else if (newWidth >= this.get('screenSm') && newWidth <= this.get('screenSmMax')) {
                newCode = 'sm';
            } else if (newWidth >= this.get('screenXs') && newWidth <= this.get('screenXsMax')) {
                newCode = 'xs';
            } else if (newWidth <= this.get('screenTyMax')) {
                newCode = 'ty';
            } else {
                //*** Just in case this doesn't work ***
                newCode = 'md';
            }
            //            if (this.get('screenCode') !== newCode) {
            //                console.log('screenCode: ' + newCode);
            //            }
            return newCode;
        },

        calculateOrientation: function (newWidth, newHeight) {
            var newOrientation;
            if (newWidth < newHeight) {
                newOrientation = 'portrait';
                $html.removeClass('landscape');
            } else {
                newOrientation = 'landscape';
                $html.removeClass('portrait');
            }
            $html.addClass(newOrientation);
            return newOrientation;
        }
    });

    return Model;
});