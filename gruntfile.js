module.exports = function(grunt) {    
    grunt.initConfig({
        umd: {
            build: {
                options: {
                    src: "src/main.js",
                    dest: "build/facebook.explorer.js",
                    globalAlias: "FBExplorer",
                    deps: {
                        "default": [
                            { "bluebird": "Promise" },
                            { "facebook": "FB" },
                            { "lodash": "_" }
                        ],
                        global: ["Promise", "FB", "_"]
                    }
                }
            }
        },
        uglify: {
            dist: {
                files: [{
                    "build/facebook.explorer.min.js": ["build/facebook.explorer.js"]
                }],
                compress: {
                    dead_code: true,
                    conditionals: true,
                    evaluate: true,
                    unused: true,
                    join_vars: true,
                    drop_console: true,
                    drop_debugger: true,
                    comparisons: true,
                    booleans: true,
                    loops: true,
                    if_return: true
                }
            }
        },
        
        _clean: {
            build: {
                src: ["build/"]
            }
        }
    });

    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-umd');
    grunt.renameTask("clean", "_clean");

    var cleanTask = ["_clean"];
    var buildTask = ["_clean", "umd", "uglify"];
    
    grunt.registerTask("default", buildTask);
    grunt.registerTask("clean", cleanTask);
    grunt.registerTask("build", buildTask);
};