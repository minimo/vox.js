(function() {

    /**
     * @constructor
     * @property {Object} size
     * @property {number} size.x
     * @property {number} size.y
     * @property {number} size.z
     * @property {Array} voxels
     * @property {Array} palette
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
