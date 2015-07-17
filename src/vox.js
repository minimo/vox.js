"use strict";

/**
 * @namespace
 */
var vox = {};

(function() {
    if (typeof(window) !== "undefined") {
        vox.global = window;
        vox.global.vox = vox;
    } else {
        vox.global = global;
    }

    if (typeof(module) !== "undefined") {
        module.exports = vox;
    }

})();
