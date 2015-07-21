(function() {

    /**
     * @constructor
     * @property {Object} size {x, y, z}
     * @property {Array} voxels [{x, y, z, colorIndex}...]
     * @property {Array} palette [{r, g, b, a}...]
     */
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
