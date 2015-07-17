(function() {
    /**
     * @constructor
     */
    vox.TextureFactory = function() {};

    /**
     * @param {vox.VoxelData} voxelData
     * @return {HTMLCanvasElement}
     */
    vox.TextureFactory.prototype.createCanvas = function(voxelData) {
        var canvas = document.createElement("canvas");
        canvas.width = 256;
        canvas.height= 1;
        var context = canvas.getContext("2d");
        for (var i = 0, len = palette.length; i < len; i++) {
            var p = palette[i];
            context.fillStyle = "rgb(" + p.r + "," + p.g + "," + p.b + ")";
            context.fillRect(i * 1, 0, 1, 1);
        }
        
        return canvas;
    };
    
    /**
     * パレット情報を元に作成したテクスチャを返す.
     * 生成されたテクスチャはキャッシュされ、同一のパレットからは同じテクスチャオブジェクトが返される.
     * @param {vox.VoxelData} voxelData
     * @return {THREE.Texture}
     */
    vox.TextureFactory.prototype.getTexture = function(voxelData) {
        var palette = voxelData.palette;
        var hashCode = getHashCode(palette);
        if (hashCode in cache) {
            // console.log("cache hit");
            return cache[hashCode];
        }
        
        var canvas = this.createCanvas(voxelData);
        var texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        
        cache[hashCode] = texture;
        
        return texture;
    };
    
    var cache = {};
    
    var getHashCode = function(palette) {
        var str = "";
        for (var i = 0; i < 256; i++) {
            var p = palette[i];
            str += hex(p.r);
            str += hex(p.g);
            str += hex(p.b);
            str += hex(p.a);
        }
        return vox.md5(str);
    };
    var hex = function(num) {
        var r = num.toString(16);
        return (r.length === 1) ? "0" + r : r;
    };

})();
