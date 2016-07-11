(function() {

    /**
     * @constructor
     *
     * @param {vox.VoxelData} voxelData
     * @param {Object=} param
     * @param {number=} param.voxelSize ボクセルの大きさ. default = 1.0.
     * @param {boolean=} param.vertexColor 頂点色を使用する. default = false.
     * @param {boolean=} param.optimizeFaces 隠れた頂点／面を削除する. dafalue = true.
     * @param {boolean=} param.originToBottom 地面の高さを形状の中心にする. dafalue = true.
     * @property {GLBoost.Geometry} geometry
     * @property {GLBoost.Material} material
     */
    vox.GLBoostMeshBuilder = function(GLBoostContext, voxelData, param) {
        if (vox.GLBoostMeshBuilder.textureFactory === null) vox.GLBoostMeshBuilder.textureFactory = new vox.TextureFactory();
        
        param = param || {};
        this.voxelData = voxelData;
        this.voxelSize = param.voxelSize || vox.GLBoostMeshBuilder.DEFAULT_PARAM.voxelSize;
        this.vertexColor = (param.vertexColor === undefined) ? vox.GLBoostMeshBuilder.DEFAULT_PARAM.vertexColor : param.vertexColor;
        this.optimizeFaces = (param.optimizeFaces === undefined) ? vox.GLBoostMeshBuilder.DEFAULT_PARAM.optimizeFaces : param.optimizeFaces;
        this.originToBottom = (param.originToBottom === undefined) ? vox.GLBoostMeshBuilder.DEFAULT_PARAM.originToBottom : param.originToBottom;

        this.geometry = null;
        this.material = null;
        this.glbc = GLBoostContext;

        this.build();
    };

    vox.GLBoostMeshBuilder.DEFAULT_PARAM = {
        voxelSize: 1.0,
        vertexColor: false,
        optimizeFaces: true,
        originToBottom: true,
    };

    /**
     * Voxelデータからジオメトリとマテリアルを作成する.
     */
    vox.GLBoostMeshBuilder.prototype.build = function() {

        // 隣接ボクセル検索用ハッシュテーブル
        this.hashTable = createHashTable(this.voxelData.voxels);

        // ジオメトリ情報
        this.geometry = this.glbc.createGeometry();
        
        var offsetX = (this.voxelData.size.x - 1) * -0.5;
        var offsetY = (this.voxelData.size.y - 1) * -0.5;
        var offsetZ = (this.originToBottom) ? 0 : (this.voxelData.size.z - 1) * -0.5;
        this.voxelData.voxels.forEach(function(voxel) {
            var vg = this._createVoxGeometry(voxel);
            if (vg) {
                var x =  (voxel.x + offsetX) * this.voxelSize;
                var y =  (voxel.y + offsetY) * this.voxelSize;
                var z =  (voxel.z + offsetZ) * this.voxelSize;
                var t = new GLBoost.Vector3(x, z, -y);
                vg.positions.forEach(function(p) {
                    p.add(t);
                });
                this.geometry.merge(vg);
            }
        }.bind(this));

        if (this.optimizeFaces) {
            // this.geometry.mergeVertices();
        }
//        this.geometry.computeFaceNormals();
        
        if (this.vertexColor) {
            // this.material.vertexColors = THREE.FaceColors;
        } else {
//            this.material.texture = vox.GLBoostMeshBuilder.textureFactory.getTexture(this.voxelData);
        }
    };

    /**
     * @return {GLBoost.Texture}
     */
    vox.GLBoostMeshBuilder.prototype.getTexture = function() {
        return vox.GLBoostMeshBuilder.textureFactory.getTexture(this.voxelData);
    };

    vox.GLBoostMeshBuilder.prototype._createVoxGeometry = function(voxel) {
        // 隣接するボクセルを検索し、存在する場合は面を無視する
        var ignoreFaces = [];
        if (this.optimizeFaces) {
            six.forEach(function(s) {
                if (this.hashTable.has(voxel.x + s.x, voxel.y + s.y, voxel.z + s.z)) {
                    ignoreFaces.push(s.ignoreFace);
                }
            }.bind(this));
        }
        
        // 6方向すべて隣接されていたらnullを返す
        if (ignoreFaces.length ===  6) return null;

        // 頂点データ
        var voxVertices = voxVerticesSource.map(function(voxel) {
            var vs = this.voxelSize * 0.5;
            return new GLBoost.Vector3(voxel.x * vs, voxel.y * vs, voxel.z * vs);
        }.bind(this));

        // 面データ
        var voxFaces = voxFacesSource.map(function(f) {
            return {
                faceA: [f.faceA.a, f.faceA.b, f.faceA.c],
                faceB: [f.faceB.a, f.faceB.b, f.faceB.c],
            };
        });
        
        // 頂点色
        if (this.vertexColor) {
            var c = this.voxelData.palette[voxel.colorIndex];
            var color = new GLBoost.Vector3(c.r / 255, c.g / 255, c.b / 255);
        }

        var faceArray = [];
        
        // 面を作る
        voxFaces.forEach(function(faces, i) {
            if (ignoreFaces.indexOf(i) >= 0) return;
            
            if (this.vertexColor) {
                faces.faceA.color = color;
                faces.faceB.color = color;
            } else {
                faces.faceA.color = 255;
                faces.faceB.color = 255;
                var uv = new GLBoost.Vector2((voxel.colorIndex+0.5)/256, 0.5);
                faces.faceVertexUvs = [];
                faces.faceVertexUvs.push([uv, uv, uv], [uv, uv, uv]);
            }
            faceArray.push(faces.faceA, faces.faceB);
        }.bind(this));
        
        // 使っている頂点を抽出
        var usingVertices = [];
        faceArray.forEach(function(face) {
            usingVertices[face.a] = true;
            usingVertices[face.b] = true;
            usingVertices[face.c] = true;
        });
        
        // 面の頂点インデックスを詰める処理
        var splice = function(index) {
            faceArray.forEach(function(face) {
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

        //　ジオメトリに使用する頂点情報を作成
        var position = [];

        return this.glbc.createGeometry({
        });
    };

    /**
     * @return {GLBoost.Mesh}
     */
    vox.GLBoostMeshBuilder.prototype.createMesh = function() {
        return this.glbc.createMesh(this.geometry, this.material);
    };
    
    /**
     * 外側に面したボクセルか
     * @return {boolean}
     */
    vox.GLBoostMeshBuilder.prototype.isOuterVoxel = function(voxel) {
        return six.filter(function(s) {
            return this.hashTable.has(voxel.x + s.x, voxel.y + s.y, voxel.z + s.z);
        }.bind(this)).length < 6;
    };

    /**
     * @static
     * @type {vox.TextureFactory}
     */
    vox.GLBoostMeshBuilder.textureFactory = null;

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
        var prime = 503;
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
