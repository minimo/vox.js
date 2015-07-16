module.exports = function(grunt) {
    var SRC = [
        "src/vox.js",
        "src/voxeldata.js",
        "src/xhr.js",
        "src/parser.js",
        "src/meshbuilder.js",
        "src/texturefactory.js",
        "src/defaultpalette.js",

        "src/md5.js",
    ];
    
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-watch");

    grunt.initConfig({
        concat: {
            vox: {
                src: SRC,
                dest: "build/vox.js"
            }
        },
        watch: {
            vox: {
                files: SRC,
                tasks: ["concat"],
            }
        }
    });
    
    grunt.registerTask("default", ["concat"]);
};
