/* globals swfobject, _gaq, nikart */
/**
 * @author nikart.co.uk
 */
(function (nikart, window) {
    'use strict';

    nikart.popWin = function (filename, winname, width, height, resize, scrollbars, location) {
        var left = screen.availWidth / 2 - width / 2;
        var top = screen.availHeight / 2 - height / 2;
        var winspecs = 'toolbar=no,directories=no,status=no,menubar=no,width=' + width + ',height=' + height + ',left=' + left + ',top=' + top + ',resizable=' + resize + ',scrollbars=' + scrollbars + ',location=' + location;
        var popup = window.open(filename, winname, winspecs);
        popup.focus();

        nikart.doTracker(winname + '_launch');
    };

    nikart.doTracker = function (str) {
        //TODO *** Possibly fix this tracking ***
        str = 'fl_' + str;
        window._gaq = window._gaq || [];
//          _gaq.push(['_trackEvent', 'fl', 'click', str]);
        window._gaq.push(['_trackPageview', str]);
        console.log("nikart.doTracker: " + str);
    };
})(nikart, window);
