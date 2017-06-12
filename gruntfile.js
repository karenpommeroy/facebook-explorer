module.exports = function(grunt) {    
    grunt.initConfig({
        requirejs: {
            dev: {
                options: {
                    name: "src/main",
                    mainConfigFile: "src/main.js",
                    out: "build/facebook.explorer.js",
                    paths: {
                        "facebook": "//connect.facebook.net/en_US/sdk.js?version=v2.9",
                        "bluebird": "empty:",
                        "lodash": "empty:",
                        "jquery": "empty:"
                    },
                    shim: {
                        "facebook": { exports: "FB" }
                    },
                    optimize: "none"
                }
            },
            dist: {
                options: {
                    name: "src/main",
                    mainConfigFile: "src/main.js",
                    out: "build/facebook.explorer.min.js",
                    paths: {
                        "facebook": "//connect.facebook.net/en_US/sdk.js?version=v2.9",
                        "bluebird": "empty:",
                        "lodash": "empty:",
                        "jquery": "empty:"
                    },
                    shim: {
                        "facebook": { exports: "FB" }
                    },
                    optimize: "uglify2",
                    uglify2: {
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
                }
            }
        },
        
        downloadfile: {
            files: [
                {
                    url: "https://connect.facebook.net/en_US/sdk.js?version=v2.9",
                    dest: "lib/",
                    name: "facebook.sdk.js",
                    overwrite: false
                }
            ]
        },
        
        _clean: {
            build: {
                src: ["build/"]
            }
        }
    });

    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-contrib-requirejs");
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-downloadfile');
    grunt.renameTask("clean", "_clean");

    var cleanTask = ["_clean"];
    var buildTask = ["_clean", "downloadfile", "requirejs"];
    
    grunt.registerTask("default", buildTask);
    grunt.registerTask("clean", cleanTask);
    grunt.registerTask("build", buildTask);
};