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

            this.listenTo(vent, vent.ventNavItemClicked, this.onNavItemClicked);
            this.listenTo(vent, vent.ventThumbItemClicked, this.onThumbItemClicked);
            this.listenTo(vent, vent.ventBreadcrumbClicked, this.onBreadcrumbClicked);

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

        onBreadcrumbClicked: function (idStr) {
            if (!this.curItem) {
                this.resetVars();
            }
            vent.trigger(vent.ventNavClose);
            vent.trigger(vent.ventThumbClose);
            this.onItemClicked(idStr);
        },

        resetVars: function () {
            this.pathArr = [];
            this.curItem = this.jsonModel.attributes;
        },

        setCurItem: function (idStr) {
            // var curMenu = this.curItem.menu;
            // if (curMenu) {
            //     for (var i = 0; i < curMenu.length; i += 1) {
            //         if (curMenu[i].id === idStr) {
            //             this.addToPath(i, curMenu[i].id, common.getLangStr(curMenu[i], 'title'));
            //             break;
            //         }
            //     }
            // }
            this.resetVars();
            this.findItem(idStr, this.curItem.menu, []);
            console.log('setCurItem - this.pathArr: ' + JSON.stringify(this.pathArr));
        },

        findItem: function (idStr, menu, path) {
            var found;
            var pathEntry;
            if (menu) {
                for (var i = 0; i < menu.length; i += 1) {
                    var menuItem = menu[i];
                    found = menuItem.id === idStr;
                    if (found) {
                        pathEntry = { num: i, id: menuItem.id, title: common.getLangStr(menuItem.id, 'title') };
                        path.push(pathEntry);
                        console.log('findItem - ' + menuItem.id + ' found: ' + menuItem.id);
                        break;
                    } else if (menuItem.menu) {
                        pathEntry = { num: i, id: menuItem.id, title: common.getLangStr(menuItem.id, 'title') };
                        path.push(pathEntry);
                        console.log('findItem - ' + menuItem.id + ' not found but menu');
                        this.findItem(idStr, menuItem.menu, path);
                    } else {
                        path = [];
                        console.log('findItem - ' + menuItem.id + ' not found or menu: ' + menuItem.id);
                    }
                }
            }
            if (found) {
                for (var j = 0; j < path.length; j += 1) {
                    this.addToPath(path[j]);
                }
            }
            console.log('findItem - idStr: ' + idStr + ' found: ' + found + ' this.pathArr: ' + JSON.stringify(this.pathArr));
        },

        onItemClicked: function (idStr) {
            console.log('onItemClicked - before curType: ' + this.curItem.type + ', ' + idStr);
            this.setCurItem(idStr);
            console.log('onItemClicked - after curType: ' + this.curItem.type + ', ' + idStr);
            vent.trigger(vent.ventPathUpdate);
            switch (this.curItem.type) {
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