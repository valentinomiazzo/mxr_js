/*global module, require */

module.exports = function(grunt) {
    "use strict";

    require('load-grunt-tasks')(grunt);

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        "sync-json": {
            "options": {
                "indent": 4,
                "include": [
                    "name",
                    "description",
                    "version",
                    "author as authors", // is "author" in package.json, but "authors" in bower.json
                    "main",
                    "private",
                    "licenses as license"
                ]
            },
            "bower": {
                files: {
                    "bower.json": "package.json"
                }
            }
        },
        yuidoc: {
            compile: {
                name: '<%= pkg.name %>',
                description: '<%= pkg.description %>',
                version: '<%= pkg.version %>',
                url: '<%= pkg.homepage %>',
                options: {
                    paths: 'js/src/',
                    //themedir: 'path/to/custom/theme/',
                    outdir: 'build/docs/'
                }
            }
        },
        karma: {
            unit: {
                configFile: "karma.conf.js",
                singleRun: true,
                browsers: ['PhantomJS']
            }
        }
    });

    // Default task(s).
    grunt.registerTask('default', ['sync-json', 'yuidoc', 'karma']);

};
