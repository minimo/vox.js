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
