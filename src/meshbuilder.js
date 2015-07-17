(function() {

/**
 * @
 * @param {Object} param
 * @param {number=1.0} param.voxelSize ボクセルの大きさ
 * @param {boolean=false} vertexColor 頂点色を使用する
 * @param {boolean=true} optimizeFaces 隠れた頂点／面を削除する
 */
vox.MeshBuilder = function(voxelData, param) {
    if (vox.MeshBuilder.textureFactory === null) vox.MeshBuilder.textureFactory = new vox.TextureFactory();
    
    this.voxelData = voxelData;
    this.voxelSize = param.voxelSize || vox.MeshBuilder.DEFAULT_PARAM.voxelSize;
    this.vertexColor = param.vertexColor || vox.MeshBuilder.DEFAULT_PARAM.vertexColor;
    this.optimizeFaces = param.optimizeFaces || vox.MeshBuilder.DEFAULT_PARAM.optimizeFaces;

    this.geometry = null;
    this.material = null;
    
    this.build();
};

vox.MeshBuilder.DEFAULT_PARAM = {
    voxelSize: 1.0,
    vertexColor: false,
    optimizeFaces: true,
};

vox.MeshBuilder.prototype.build = function() {
    this.geometry = new THREE.Geometry();
    this.material = new THREE.MeshPhongMaterial();

    // 隣接ボクセル検索用ハッシュテーブル
    var hashTable = createHashTable(this.voxelData.voxels);
    
    this.voxelData.voxels.forEach(function(voxel) {
        var voxGeometry = this._createVoxGeometry(voxel, hashTable);
        if (voxGeometry) {
            var offsetX = this.voxelData.size.x * -0.5;
            var offsetY = this.voxelData.size.y * -0.5;
            var matrix = new THREE.Matrix4();
            matrix.makeTranslation((voxel.x + offsetX) * this.voxelSize, voxel.z * this.voxelSize, -(voxel.y + offsetY) * this.voxelSize);
            this.geometry.merge(voxGeometry, matrix);
        }
    }.bind(this));

    this.geometry.mergeVertices();
    this.geometry.computeFaceNormals();
    
    if (this.vertexColor) {
        this.material.vertexColors = THREE.FaceColors;
    } else {
        this.material.map = vox.MeshBuilder.textureFactory.getTexture(this.voxelData);
    }
};

vox.MeshBuilder.prototype.getTexture = function() {
    return vox.MeshBuilder.textureFactory.getTexture(this.voxelData);
};

vox.MeshBuilder.prototype._createVoxGeometry = function(voxel, hashTable) {

    // 隣接するボクセルを検索し、存在する場合は面を無視する
    var ignoreFaces = [];
    if (this.optimizeFaces) {
        six.forEach(function(s) {
            if (hashTable.has(voxel.x + s.x, voxel.y + s.y, voxel.z + s.z)) {
                ignoreFaces.push(s.ignoreFace);
            }
        });
    }
    
    // 6方向すべて隣接されていたらnullを返す
    if (ignoreFaces.length ===  6) return null;

    // 頂点データ
    var voxVertices = voxVerticesSource.map(function(voxel) {
        return new THREE.Vector3(voxel.x * this.voxelSize * 0.5, voxel.y * this.voxelSize * 0.5, voxel.z * this.voxelSize * 0.5);
    }.bind(this));

    // 面データ
    var voxFaces = voxFacesSource.map(function(f) {
        return {
            faceA: new THREE.Face3(f.faceA.a, f.faceA.b, f.faceA.c),
            faceB: new THREE.Face3(f.faceB.a, f.faceB.b, f.faceB.c),
        };
    });
    
    // 頂点色
    if (this.vertexColor) {
        var c = this.voxelData.palette[voxel.colorIndex];
        var color = new THREE.Color(c.r / 255, c.g / 255, c.b / 255);
    }

    var vox = new THREE.Geometry();
    vox.faceVertexUvs[0] = [];
    
    // 面を作る
    voxFaces.forEach(function(faces, i) {
        if (ignoreFaces.indexOf(i) >= 0) return;
        
        if (this.vertexColor) {
            faces.faceA.color = color;
            faces.faceB.color = color;
        } else {
            var uv = new THREE.Vector2((voxel.colorIndex + 0.5) / 256, 0.5);
            vox.faceVertexUvs[0].push([uv, uv, uv], [uv, uv, uv]);
        }
        vox.faces.push(faces.faceA, faces.faceB);
    }.bind(this));
    
    // 使っている頂点を抽出
    var usingVertices = {};
    vox.faces.forEach(function(face) {
        usingVertices[face.a] = true;
        usingVertices[face.b] = true;
        usingVertices[face.c] = true;
    });
    
    // 面の頂点インデックスを詰める処理
    var splice = function(index) {
        vox.faces.forEach(function(face) {
            if (face.a > index) face.a -= 1;
            if (face.b > index) face.b -= 1;
            if (face.c > index) face.c -= 1;
        });
    };

    // 使っている頂点のみ追加する
    var j = 0;
    voxVertices.forEach(function(vertex, i) {
        if (usingVertices[i]) {
            vox.vertices.push(vertex);
        } else {
            splice(i - j);
            j += 1;
        }
    });
    
    return vox;
};

vox.MeshBuilder.prototype.createMesh = function() {
    return new THREE.Mesh(this.geometry, this.material);
};

vox.MeshBuilder.textureFactory = null;

// 隣接方向と無視する面の対応表
var six = [
    { x: -1, y: 0, z: 0, ignoreFace: 0 },
    { x:  1, y: 0, z: 0, ignoreFace: 1 },
    { x:  0, y:-1, z: 0, ignoreFace: 5 },
    { x:  0, y: 1, z: 0, ignoreFace: 4 },
    { x:  0, y: 0, z:-1, ignoreFace: 2 },
    { x:  0, y: 0, z: 1, ignoreFace: 3 },
];

// 頂点データソース
var voxVerticesSource = [
    { x: -1, y: 1, z:-1 },
    { x:  1, y: 1, z:-1 },
    { x: -1, y: 1, z: 1 },
    { x:  1, y: 1, z: 1 },
    { x: -1, y:-1, z:-1 },
    { x:  1, y:-1, z:-1 },
    { x: -1, y:-1, z: 1 },
    { x:  1, y:-1, z: 1 },
];

// 面データソース
var voxFacesSource = [
    { faceA: { a:6, b:2, c:0 }, faceB: { a:6, b:0, c:4 } },
    { faceA: { a:5, b:1, c:3 }, faceB: { a:5, b:3, c:7 } },
    { faceA: { a:5, b:7, c:6 }, faceB: { a:5, b:6, c:4 } },
    { faceA: { a:2, b:3, c:1 }, faceB: { a:2, b:1, c:0 } },
    { faceA: { a:4, b:0, c:1 }, faceB: { a:4, b:1, c:5 } },
    { faceA: { a:7, b:3, c:2 }, faceB: { a:7, b:2, c:6 } },
];

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
