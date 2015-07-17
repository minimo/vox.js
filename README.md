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

```.parse(url)``` method returns Promise object.

### build THREE.Mesh object

#### html

```html
<script src="three.js"></script>
<script src="vox.js"></script>
```

#### javascript

```js
var scene = new THREE.Scene();

var param = { voxelSize: 5 };
var builder = new vox.MeshBuilder(voxelData, param);
var mesh = builder.createMesh();
scene.add(mesh);

```

```.createMesh(voxelData, param)``` method returns THREE.Mesh object.

### create Image from palette

#### html

```html
<script src="vox.js"></script>
<img id="img">
```

#### javascript

```js
var textureFactory = new vox.TextureFactory();
var canvas = textureFactory.createCanvas(voxelData);
document.getElementById("img").src = canvas.toDataURL();
```
```.createCanvas(voxelData)``` method returns HTMLCanvasElement.
