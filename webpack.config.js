var ExtractTextPlugin = require('extract-text-webpack-plugin');
var webpack = require('webpack')
var DEV = process.env.NODE_ENV !== 'production';
var definePlugin = new webpack.DefinePlugin({
    __DEV__: DEV,
    __SERVER__: false
});

module.exports = {
    cache: true,
    context: __dirname + '/assets',
    entry: "./js/main.js",
    target: "web",
    node: {
        __dirname: true,
        fs: 'empty'
    },
    output: {
        filename: "main.js",
        chunkFilename: "[name].[id].js",
        path: __dirname + "/.tmp/public/js"
    },
    devtool: DEV ? 'inline-source-map' : null,
    module: {
        loaders: [{
            test: /\.js$/,
            exclude: /node_modules/,
            loader: "babel"
        }, /*, {
            test: /(\.jsx|\.js)$/,
            loader: "eslint-loader",
            exclude: /node_modules/
        }, */{
            test: /\.(scss|css)$/,
            loader: ExtractTextPlugin.extract(
                // activate source maps via loader query
                'css?sourceMap!' +
                'sass?sourceMap'
            )
        }, {
            test: /\.gif$/,
            loader: "url-loader?mimetype=image/png"
        }, {
            test: /\.(png|jpg)$/,
            loader: 'url-loader?limit=8192'
        }, {
            test: /\.(svg|woff|woff2|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
            loader: "file?name=../css/[name].[ext]"
        }],
    },
    plugins: [
        definePlugin,
        // extract inline css into separate 'styles.css'
        new ExtractTextPlugin('../css/styles.css'),
        new webpack.optimize.DedupePlugin()
    ]
}