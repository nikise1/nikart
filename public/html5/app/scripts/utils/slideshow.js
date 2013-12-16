/* global define */
define([
    'jquery',
    'tweenlite'
], function ($, TweenLite) {
    'use strict';

    return {
        // Taken from http://www.sajithmr.me/javascript-check-an-image-is-loaded-or-not
        isImageOk: function (img) {
            // During the onload event, IE correctly identifies any images that
            // weren't downloaded as not complete. Others should too. Gecko-based
            // browsers act like NS4 in that they report this incorrectly.
            if (!img.complete) {
                return false;
            }

            // However, they do have two very useful properties: naturalWidth and
            // naturalHeight. These give the true size of the image. If it failed
            // to load, either of these should be zero.
            if (typeof img.naturalWidth !== 'undefined' && img.naturalWidth === 0) {
                return false;
            }

            // No other way of checking: assume it's ok.
            return true;
        },

        animate: function () {

            // trace('test for ' + newImg.url);

            if (this.isImageOk(this.topImg.img) && this.isImageOk(this.newImg.img)) {

                this.centreImgVertically($(this.newImg.li));

                TweenLite.to(this.topImg.li, this.timeFade, {autoAlpha: 0});
                TweenLite.to(this.newImg.li, this.timeFade, {autoAlpha: 1, onComplete: this.reOrder, onCompleteParams: [true], onCompleteScope: this});
            } else {
                // trace('img ' + newImg.url + ' not OK');
                this.checkForNewImgLoad();
                TweenLite.delayedCall(0.5, this.animate, [], this);
            }
        },

        centreImgVertically: function ($li) {
            $li.css('margin-top', -$li.outerHeight() / 2);
        },

        reOrder: function (changeBool) {
            var i;
//            console.log('changeBool: ' + changeBool);
            if (changeBool) {
                this.imgsArr.unshift(this.imgsArr.pop());
                TweenLite.delayedCall(this.timeDelay, this.animate, [], this);
            }
            for (i = 0; i < this.imgsArr.length; i++) {
                this.imgsArr[i].li.style.zIndex = i + 1;
            }
            this.topImg = this.imgsArr[this.imgsArr.length - 1];
            if (this.imgsArr.length > 1) {
                this.newImg = this.imgsArr[this.imgsArr.length - 2];
                this.checkForNewImgLoad();
            }
        },

        checkForFirstImgLoad: function () {
            if (this.isImageOk(this.topImg.img)) {
                this.centreImgVertically($(this.topImg.li));
                TweenLite.to(this.topImg.li, this.timeFade, {autoAlpha: 1});
//                console.log('this.imgsArr.length: ' + this.imgsArr.length);
                if (this.imgsArr.length > 1) {
                    TweenLite.delayedCall(this.timeDelay, this.animate, [], this);
                }
            } else {
                TweenLite.delayedCall(0.5, this.checkForFirstImgLoad, [], this);
            }
        },

        checkForNewImgLoad: function () {
            if (this.isImageOk(this.topImg.img) && !this.newImg.img.src) {
                this.newImg.img.src = this.newImg.url;
            }
        },

        init: function ($origImgClass, $timeDelay, $timeFade, $otherImgURLs, $classToAdd) {
            this.timeDelay = $timeDelay;
            this.timeFade = $timeFade;
            this.classToAdd = $classToAdd;

            var containerUL, curLI, img, i;

            containerUL = document.createElement('ul');
            $(containerUL).addClass('slideshow-container');

            curLI = document.createElement('li');
            curLI.style.opacity = 0;
//            curLI.style.visibility = 'visible';
            containerUL.appendChild(curLI);

            img = $('.' + $origImgClass)[0];

            img.parentNode.appendChild(containerUL);
            curLI.appendChild(img);

            this.imgsArr = [
                {
                    img: img,
                    li: curLI,
                    url: img.src
                }
            ];
            // trace('this.imgsArr[0].url: ' + this.imgsArr[0].url);

            for (i = 0; i < $otherImgURLs.length + 1; i++) {
                if (i !== 0) {
                    img = document.createElement('img');
                    img.className = this.classToAdd;

                    curLI = document.createElement('li');
                    containerUL.appendChild(curLI);
                    curLI.appendChild(img);
                    curLI.style.opacity = 0;
                    curLI.style.visibility = 'hidden';

                    this.imgsArr.unshift({
                        img: img,
                        li: curLI,
                        url: $otherImgURLs[i - 1]
                    });
                }
            }
            this.reOrder(false);
            this.checkForFirstImgLoad();
        },

        pause: function () {
            TweenLite.killDelayedCallsTo(this.animate);
            TweenLite.killDelayedCallsTo(this.checkForFirstImgLoad);
            if (this.topImg && this.topImg.li) {
                TweenLite.killTweensOf(this.topImg.li);
            }
            if (this.newImg && this.newImg.li) {
                TweenLite.killTweensOf(this.newImg.li);
            }
        }
    };
});


