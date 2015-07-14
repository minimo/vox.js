(function() {
    
    vox.Xhr = function() {};
    vox.Xhr.prototype.getBinary = function(url, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.responseType = "arraybuffer";
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && (xhr.status === 200 || xhr.statue === 0)) {
                var arrayBuffer = xhr.response;
                if (arrayBuffer) {
                    var byteArray = new Uint8Array(arrayBuffer);
                    callback(byteArray);
                }
            }
        };
        xhr.send(null);
    };
    
})();
