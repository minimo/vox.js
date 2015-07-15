"use strict";

var vox = {};

(function() {
    if (typeof(window) !== "undefined") {
        vox.global = window;
    } else {
        vox.global = global;
    }
    vox.global.vox = vox;

    if (typeof(module) !== "undefined") {
        module.exports = vox;
    }

})();
