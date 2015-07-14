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
