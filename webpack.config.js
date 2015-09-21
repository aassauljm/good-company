var ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
    //cache: true,
    context: __dirname +'/assets',
    entry: "./js/main.js",

    output: {
        filename: "main.js",
        path: __dirname + "/.tmp/public/js",
    },

    devtool: 'source-map',
    module: {
        loaders: [{
            test: /\.js$/,
            exclude: /node_modules/,
            loaders: ["babel-loader"],
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