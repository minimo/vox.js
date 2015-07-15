(function() {
vox.MeshBuilder = function(voxelData, voxelSize) {
    if (vox.MeshBuilder.textureFactory === null) {
        vox.MeshBuilder.textureFactory = new vox.TextureFactory();
    }
    
    voxelSize = voxelSize || 1;
    var palette = voxelData.palette;
    var offsetX = voxelData.size.x * -0.5;
    var offsetY = voxelData.size.y * -0.5;

    this.geometry = new THREE.Geometry();
    var six = [
        { x: -1, y: 0, z: 0, ignoreFace: 0 },
        { x:  1, y: 0, z: 0, ignoreFace: 1 },
        { x:  0, y:-1, z: 0, ignoreFace: 5 },
        { x:  0, y: 1, z: 0, ignoreFace: 4 },
        { x:  0, y: 0, z:-1, ignoreFace: 2 },
        { x:  0, y: 0, z: 1, ignoreFace: 3 },
    ];
    var boxVertices = [
        { x: -1, y: 1, z:-1 },
        { x:  1, y: 1, z:-1 },
        { x: -1, y: 1, z: 1 },
        { x:  1, y: 1, z: 1 },
        { x: -1, y:-1, z:-1 },
        { x:  1, y:-1, z:-1 },
        { x: -1, y:-1, z: 1 },
        { x:  1, y:-1, z: 1 },
    ].map(function(v) {
        return new THREE.Vector3(v.x * voxelSize * 0.5, v.y * voxelSize * 0.5, v.z * voxelSize * 0.5);
    });
    var boxFaces = [
        [[ 6, 2, 0 ], [ 6, 0, 4 ]],
        [[ 5, 1, 3 ], [ 5, 3, 7 ]],
        [[ 5, 7, 6 ], [ 5, 6, 4 ]],
        [[ 2, 3, 1 ], [ 2, 1, 0 ]],
        [[ 4, 0, 1 ], [ 4, 1, 5 ]],
        [[ 7, 3, 2 ], [ 7, 2, 6 ]],
    ];
    
    var hashTable = createHashTable(voxelData.voxels);
    
    for (var i = 0, len = voxelData.voxels.length; i < len; i++) {
        var v = voxelData.voxels[i];
        var c = palette[v.colorIndex];
        var color = new THREE.Color(c.r / 255, c.g / 255, c.b / 255);
        
        var box = new THREE.Geometry();
        boxVertices.forEach(function(bv) {
            box.vertices.push(bv);
        });
        box.faceVertexUvs[0] = [];
        
        var ignore = [];
        for (var j = 0; j < 6; j++) {
            if (hashTable.has(v.x + six[j].x, v.y + six[j].y, v.z + six[j].z)) {
                ignore.push(six[j].ignoreFace);
            }
        }
        for (var j = 0; j < 6; j++) {
            if (ignore.indexOf(j) < 0) {
                var faceA = new THREE.Face3(boxFaces[j][0][0], boxFaces[j][0][1], boxFaces[j][0][2]);
                var faceB = new THREE.Face3(boxFaces[j][1][0], boxFaces[j][1][1], boxFaces[j][1][2]);
                box.faces.push(faceA, faceB);
                var uv = new THREE.Vector2((v.colorIndex + 0.5) / 256, 0.5);
                box.faceVertexUvs[0].push([uv, uv, uv], [uv, uv, uv]);
            }
        }

        var m = new THREE.Matrix4();
        m.makeTranslation((v.x + offsetX) * voxelSize, v.z * voxelSize, -(v.y + offsetY) * voxelSize);
        this.geometry.merge(box, m);
    }
    this.geometry.mergeVertices();
    this.geometry.computeFaceNormals();
    
    this.material = new THREE.MeshPhongMaterial({
        color: new THREE.Color(1, 1, 1),
        map: vox.MeshBuilder.textureFactory.getTexture(voxelData),
    });
};

vox.MeshBuilder.prototype.createMesh = function() {
    return new THREE.Mesh(this.geometry, this.material);
};

vox.MeshBuilder.textureFactory = null;

var hash = function(x, y, z) {
    var result = 1;
    var prime = 31;
    result = prime * result + x;
    result = prime * result + y;
    result = prime * result + z;
    return "" + result;
};

var createHashTable = function(voxels) {
    var hashTable = {};
    voxels.forEach(function(v) {
        hashTable[hash(v.x, v.y, v.z)] = true;
    });
    
    hashTable.has = function(x, y, z) {
        return hash(x, y, z) in this;
    }
    return hashTable;
};

})();
