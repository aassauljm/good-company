var ExtractTextPlugin = require('extract-text-webpack-plugin');
var webpack = require('webpack')
var definePlugin = new webpack.DefinePlugin({
  __DEV__: process.env.NODE_ENV!=='production'
});

module.exports = {
    cache: true,
    context: __dirname +'/assets',
    entry: "./js/main.js",
    target:  "web",
    node:    {
        __dirname: true,
        fs:        'empty'
    },
    output: {
        filename: "main.js",
        chunkFilename: "[name].[id].js",
        path: __dirname + "/.tmp/public/js",
    },

    devtool: 'source-map',
    module: {
        loaders: [{
            test: /\.js$/,
            exclude: /node_modules/,
            loader: "babel-loader",
            query: {stage: 0}
        }, {
            test: /\.scss$/,
            loader: ExtractTextPlugin.extract(
                // activate source maps via loader query
                'css?sourceMap!' +
                'sass?sourceMap'
            )
        }],
    },
    plugins: [
        definePlugin,
        // extract inline css into separate 'styles.css'
        new ExtractTextPlugin('../css/styles.css'),
        new webpack.optimize.DedupePlugin()
    ]
}