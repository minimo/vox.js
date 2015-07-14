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

    var hashTable = createHashTable(voxelData.voxels);

    var sixDir = [
        { x:-1, y: 0, z: 0, rect: [-.5,  .5, -.5, -.5,  .5,  .5, -.5, -.5, -.5, -.5, -.5,  .5] },
        { x: 1, y: 0, z: 0, rect: [ .5,  .5,  .5,  .5,  .5, -.5,  .5, -.5,  .5,  .5, -.5, -.5] },
        { x: 0, y: 0, z:-1, rect: [ .5, -.5,  .5,  .5, -.5, -.5, -.5, -.5,  .5, -.5, -.5, -.5] },
        { x: 0, y: 0, z: 1, rect: [-.5,  .5, -.5,  .5,  .5, -.5, -.5,  .5,  .5,  .5,  .5,  .5] },
        { x: 0, y:-1, z: 0, rect: [ .5,  .5, -.5, -.5,  .5, -.5,  .5, -.5, -.5, -.5, -.5, -.5] },
        { x: 0, y: 1, z: 0, rect: [-.5,  .5,  .5,  .5,  .5,  .5, -.5, -.5,  .5,  .5, -.5,  .5] },
    ];

    this.geometry = new THREE.Geometry();

    for (var i = 0, len = voxelData.voxels.length; i < len; i++) {
        var v = voxelData.voxels[i];
        var c = palette[v.colorIndex];
        var color = new THREE.Color(c.r / 255, c.g / 255, c.b / 255);
        var m = new THREE.Matrix4();
        m.makeTranslation((v.x + offsetX) * voxelSize, v.z * voxelSize, (v.y + offsetY) * voxelSize);

        var index = 0;
        var box = new THREE.Geometry();
        for (var j = 0; j < 6; j++) {
            var d = sixDir[j];
            if (!hashTable.has(v.x+d.x, v.y+d.y, v.z+d.z)) {
                box.vertices.push(
                    new THREE.Vector3(d.rect[0]*voxelSize, d.rect[1]*voxelSize, d.rect[2]*voxelSize),
                    new THREE.Vector3(d.rect[3]*voxelSize, d.rect[4]*voxelSize, d.rect[5]*voxelSize),
                    new THREE.Vector3(d.rect[6]*voxelSize, d.rect[7]*voxelSize, d.rect[8]*voxelSize),
                    new THREE.Vector3(d.rect[9]*voxelSize, d.rect[10]*voxelSize, d.rect[11]*voxelSize)
                );
                var faceA = new THREE.Face3(index, index + 3, index + 1);
                faceA.vertexColors.push(color, color, color);
                var faceB = new THREE.Face3(index, index + 2, index + 3);
                faceB.vertexColors.push(color, color, color);
                box.faces.push(faceA);
                box.faces.push(faceB);
                index += 4;
            }
        }

        this.geometry.merge(box, m);
    }

    this.geometry.mergeVertices();

    this.material = new THREE.MeshLambertMaterial({
        vertexColors: THREE.VertexColors,
    });
};
vox.MeshFactory.prototype.getGeometry = function() {
    return this.geometry;
};
vox.MeshFactory.prototype.getMaterial = function() {
    return this.material;
};
vox.MeshFactory.prototype.createMesh = function() {
    return new THREE.Mesh(this.geometry, this.material);
};

var hash = function(x, y, z) {
    var result = 1;
    var prime = 301;
    result = prime * result + x;
    result = prime * result + y;
    result = prime * result + z;
    return "" + result;
};

var createHashTable = function(voxelArray) {
    var hashTable = {};
    voxelArray.forEach(function(v) {
        hashTable[hash(v.x, v.y, v.z)] = true;
    });

    hashTable.has = function(x, y, z) {
        return hash(x, y, z) in this;
    };
    return hashTable;
};

})();
