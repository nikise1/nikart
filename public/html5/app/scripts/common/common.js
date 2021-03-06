/* global define */
define([], function () {
    'use strict';

    return {
        timeNavStaggerIn: 0.1,
        timeNavStaggerOut: 0.075,
        timeNavGrowIn: 0.5,
        timeNavGrowOut: 0.5,
        timeNavDelayIn: 0.5,
        timeNavIn: 1.2,
        timeNavOut: 0.5,
        timeDelayThumbIn: 1.5,
        timeThumbIn: 1.5,
        timeThumbOut: 0.5,
        timeArticleIn: 1.5,
        timeArticleOut: 0.5,
        timeAniFrame: 1 / 30,
        timeDelayScrollStopped: 0.15,
        timeDelayScrollStoppedPoll: 0.01,

        maxHeightTxtWeb: 240,
        maxHeightImg: 320,
        maxHeightTxtWebXs: 210,
        maxHeightImgXs: 280,

        lang: undefined,

        colourDark: '#1C6B00',
        colourMid: '#94B864',
        colourLight: '#D6D59D',

        colourDiffDark: '#4F3E2D',
        colourDiffLight: '#A8682B',

        setLang: function (str) {
            this.lang = str;
//            console.log('this.lang: ' + this.lang);
        },

        getLangStr: function (obj, key) {
            var curStr = '';
            var exists = (obj && obj[key]) ? true : false;
            if (exists) {
                curStr = (obj[key][this.lang]) ? obj[key][this.lang] : obj[key];

                //*** Other Versions ***
                var otherVersionStr = '{{otherversions}}';
                if (curStr.length > 0 && curStr.indexOf(otherVersionStr) !== -1) {
                    curStr = 'Config' + curStr.substr(otherVersionStr.length);
                }
            }
//            console.log('curStr: ' + curStr);
            return curStr;
        },

        urlContent: function () {
            return '../content';
        },

        urlStatic: function () {
            return (window.nikart && window.nikart.staticFilesStr) ? window.nikart.staticFilesStr : '../static';
        },

        urlData: function () {
            return this.urlContent() + '/json/data.json';
        },

        urlImg: function () {
            return this.urlContent() + '/img';
        },

        urlVideoH264: function () {
            return this.urlStatic() + '/video_h264';
        },

        urlVideoWebm: function () {
            return this.urlStatic() + '/video_webm';
        },

        processURL: function (urlLink) {
            var isSelf = false;
            if (urlLink.indexOf('_self/') !== -1) {
                urlLink = urlLink.slice(6);
                isSelf = true;
            } else if (urlLink.indexOf('http://') === -1 && urlLink.indexOf('https://') === -1) {
                urlLink = this.urlStatic() + '/' + urlLink;
            }
            return {urlLink: urlLink, isSelf: isSelf};
        },

        strWith0s: function (num, digits) {
            var str = num.toString();
            while (str.length < digits) {
                str = '0' + str;
            }
            return str;
        }
    };
});
