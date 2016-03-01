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
                //reasons: true
            },
            progress: false,
            plugins: webpackConfig.plugins.concat(
                new webpack.DefinePlugin({
                    "process.env": {
                        // This has effect on the react lib size
                        "NODE_ENV": JSON.stringify("production")
                    }
                }),
                new webpack.optimize.DedupePlugin(),
                new webpack.optimize.UglifyJsPlugin()
            )
        },
        "build-dev": {
            stats: {
                // Configure the console output
                colors: true,
                //modules: true,
                //reasons: true
            },
            progress: false,
            failOnError: false,
            watch: true, // use webpacks watcher
            // You need to keep the grunt process alive

            keepalive: true, // don't finish the grunt task
            debug: true
        }
    });
    /*grunt.config.set("webpack-dev-server", {
        options: {
            webpack: webpackConfig,
            publicPath: "/" + webpackConfig.output.publicPath
        },
        start: {
            keepAlive: true,
            webpack: {
                devtool: "eval",
                debug: true
            }
        }
    });*/

    grunt.loadNpmTasks("grunt-webpack");
}