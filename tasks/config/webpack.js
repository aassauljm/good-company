module.exports = function(grunt) {

    var webpackConfig = require("../../webpack.config.js");
    var webpack = require("webpack");
    grunt.config.set('webpack', {
        options: webpackConfig,
        build: {
            stats: {
                // Configure the console output
                colors: true,
                //modules: true,
                reasons: true
            },
            progress: false,
        },
        "build-dev": {
            //stats: {
            //    // Configure the console output
          //     colors: true,
                //modules: true,
                //reasons: true
           // },
            //progress: false,
           // failOnError: false,
            watch: true, // use webpacks watcher
            // You need to keep the grunt process alive

            //keepalive: true, // don't finish the grunt task
        }
    });

    grunt.loadNpmTasks("grunt-webpack");
}