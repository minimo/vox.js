"use strict";

var vox = {};

(function() {
    if (typeof(window) !== "undefined") {
        vox.global = window;
    } else {
        vox.global = global;
    }

    if (typeof(module) !== "undefined") {
        module.exports = vox;
    }

})();

(function() {

    vox.VoxelData = function() {
        this.size = {
            x: 0,
            y: 0,
            z: 0
        };
        this.voxels = [];
        this.palette = [];
    };
    
})();

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

(function() {
    
    vox.Parser = function() {};
    vox.Parser.prototype.parse = function(url, callback) {
        var xhr = new vox.Xhr();
        xhr.getBinary(url, function(byteArray) {
            this.parseUint8Array(byteArray, callback);
        }.bind(this));
    };

    if (typeof(require) !== "undefined") {
        var fs = require("fs");
        vox.Parser.prototype.parseFile = function(path, callback) {
            fs.readFile(path, function(error, data) {
                if (error) {
                    return callback(error);
                } else {
                    var byteArray = new Uint8Array(new ArrayBuffer(data.length));
                    for (var i = 0, len = data.length; i < len; i++) {
                        byteArray[i] = data[i];
                    }
                    this.parseUint8Array(byteArray, callback);
                }
            }.bind(this));
        };
    }
    
    vox.Parser.prototype.parseUint8Array = function(byteArray, callback) {
        var dataHolder = new DataHolder(byteArray);
        try {
            root(dataHolder);
            callback(null, dataHolder.data);
        } catch (e) {
            callback(e);
        }
    };
    
    var DataHolder = function(byteArray) {
        this.byteArray = byteArray;
        this.cursor = 0;
        this.data = new vox.VoxelData();
        
        this._currentChunkId = null;
        this._currentChunkSize = 0;
    };
    DataHolder.prototype.next = function() {
        if (this.byteArray.byteLength <= this.cursor) {
            throw new Error("byteArray index out of bounds: " + this.byteArray.byteLength);
        }
        return this.byteArray[this.cursor++];
    };
    DataHolder.prototype.hasNext = function() {
        return this.cursor < this.byteArray.byteLength;
    };
    
    var root = function(dataHolder) {
        magicNumber(dataHolder);
        versionNumber(dataHolder);
        while (chunk(dataHolder));
    };
    
    var magicNumber = function(dataHolder) {
        var str = "";
        for (var i = 0; i < 4; i++) {
            str += String.fromCharCode(dataHolder.next());
        }
        
        if (str !== "VOX ") {
            throw new Error("invalid magic number '" + str + "'");
        }
    };
    
    var versionNumber = function(dataHolder) {
        var ver = 0;
        for (var i = 0; i < 4; i++) {
            ver += dataHolder.next() * Math.pow(256, i);
        }
        console.info(".vox format version " + ver);
    };
    
    var chunk = function(dataHolder) {
        chunkId(dataHolder);
        sizeOfChunkContents(dataHolder);
        totalSizeOfChildrenChunks(dataHolder);
        contents(dataHolder);
        return dataHolder.hasNext();
    };
    
    var chunkId = function(dataHolder) {
        var id = "";
        for (var i = 0; i < 4; i++) {
            id += String.fromCharCode(dataHolder.next());
        }
        dataHolder._currentChunkId = id;
        dataHolder._currentChunkSize = 0;
    };
    
    var sizeOfChunkContents = function(dataHolder) {
        var size = 0;
        for (var i = 0; i < 4; i++) {
            size += dataHolder.next() * Math.pow(256, i);
        }
        dataHolder._currentChunkSize = size;
    };
    
    var totalSizeOfChildrenChunks = function(dataHolder) {
        var size = 0;
        for (var i = 0; i < 4; i++) {
            size += dataHolder.next() * Math.pow(256, i);
        }
    };
    
    var contents = function(dataHolder) {
        switch (dataHolder._currentChunkId) {
        case "SIZE":
            contentsOfSizeChunk(dataHolder);
            break;
        case "XYZI":
            contentsOfVoxelChunk(dataHolder);
            break;
        case "RGBA":
            contentsOfPaletteChunk(dataHolder);
            break;
        }
    };
    
    var contentsOfSizeChunk = function(dataHolder) {
        var x = 0;
        for (var i = 0; i < 4; i++) {
            x += dataHolder.next() * Math.pow(256, i);
        }
        var y = 0;
        for (var i = 0; i < 4; i++) {
            y += dataHolder.next() * Math.pow(256, i);
        }
        var z = 0;
        for (var i = 0; i < 4; i++) {
            z += dataHolder.next() * Math.pow(256, i);
        }
        dataHolder.data.size = {
            x: x,
            y: y,
            z: z,
        };
    };
    
    var contentsOfVoxelChunk = function(dataHolder) {
        var num = 0;
        for (var i = 0; i < 4; i++) {
            num += dataHolder.next() * Math.pow(256, i);
        }
        for (var i = 0; i < num; i++) {
            dataHolder.data.voxels.push({
                x: dataHolder.next(),
                y: dataHolder.next(),
                z: dataHolder.next(),
                colorIndex: dataHolder.next(),
            });
        }
    };

    var contentsOfPaletteChunk = function(dataHolder) {
        for (var i = 0; i < 256; i++) {
            dataHolder.data.palette.push({
                r: dataHolder.next(),
                g: dataHolder.next(),
                b: dataHolder.next(),
                a: dataHolder.next(),
            });
        }
    };

})();

(function() {
if (typeof(THREE) === "undefined") return;

vox.MeshFactory = function(voxelData, voxelSize) {
    voxelSize = voxelSize || 1;
    var palette = voxelData.palette;
    
    var offsetX = voxelData.size.x * -0.5;
    var offsetY = voxelData.size.y * -0.5;

    this.geometry = new THREE.Geometry();
    
    // とりあえず同一面とかどの方向からも見えないボクセルとかは考慮せず組み立ててみる
    for (var i = 0, len = voxelData.voxels.length; i < len; i++) {
        var v = voxelData.voxels[i];
        var c = palette[v.colorIndex];
        var color = new THREE.Color(c.r / 255, c.g / 255, c.b / 255);
        var box = new THREE.BoxGeometry(voxelSize, voxelSize, voxelSize);
        box.faces.forEach(function(f) {
            f.vertexColors.push(color);
            f.vertexColors.push(color);
            f.vertexColors.push(color);
        });
        var m = new THREE.Matrix4();
        m.makeTranslation((v.x + offsetX) * voxelSize, v.z * voxelSize, (v.y + offsetY) * voxelSize);
        this.geometry.merge(box, m);
    }
};
vox.MeshFactory.prototype.getGeometry = function() {
    return this.geometry;
};
vox.MeshFactory.prototype.getMaterial = function() {};
vox.MeshFactory.prototype.getMesh = function() {
    return new THREE.Mesh(this.geometry, new THREE.MeshLambertMaterial({
        vertexColors: THREE.VertexColors,
    }));
};

var hash = function(x, y, z) {
    var result = 1;
    var prime = 31;
    result = prime * result + x;
    result = prime * result + y;
    result = prime * result + z;
    return "" + result;
};

var VoxelUtil = {
    createHashTable: function(voxelArray) {
        var hashTable = {};
        voxelArray.forEach(function(v) {
            hashTable[hash(v.x, v.y, v.z)] = v;
        });
        
        hashTable.has = function(x, y, z) {
            return hash(x, y, z) in this;
        }
        return hashTable;
    }
};

})();
