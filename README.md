[MagicaVoxel](https://ephtracy.github.io/) model data parser and mesh builder.

## example

[http://daishihmr.github.io/vox.js/test/meshbuilderTest.html](http://daishihmr.github.io/vox.js/test/meshbuilderTest.html)

## usage

### parse .vox file

#### html

```html
<script src="vox.js"></script>
```

#### javascript

```js
var parser = new vox.Parser();
parser.parse("./p10.vox").then(function(voxelData) {
    
    voxelData.voxels; // voxel position and color data
    voxelData.size; // model size
    voxelData.palette; // palette data

});

```

```.parse(url)``` method reterns Promise object.

### build THREE.Mesh object

#### html

```html
<script src="three.js"></script>
<script src="vox.js"></script>
```

#### javascript

```js
var scene = new THREE.Scene();

var builder = new vox.MeshBuilder(voxelData, 1.0);
var mesh = builder.createMesh();
scene.add(mesh);

```

```.createMesh(voxelData, voxelSize)``` method returns THREE.Mesh object.
