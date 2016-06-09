module.exports = function(grunt) {
    var SRC = [
        "src/vox.js",
        "src/voxeldata.js",
        "src/xhr.js",
        "src/parser.js",
        "src/meshbuilder.js",
        "src/glboostmeshbuilder.js",
        "src/texturefactory.js",
        "src/defaultpalette.js",

        "src/md5.js",
    ];
    
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-contrib-uglify");

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
        },
        uglify: {
            vox: {
                src: "build/vox.js",
                dest: "build/vox.min.js"
            }
        }
    });
    
    grunt.registerTask("default", ["concat", "uglify"]);
};
