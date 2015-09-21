var ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
    cache: false,
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
        // extract inline css into separate 'styles.css'
        new ExtractTextPlugin('../css/styles.css')
    ]
}