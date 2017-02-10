var ExtractTextPlugin = require('extract-text-webpack-plugin');
var webpack = require('webpack');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var path = require("path");
var autoprefixer = require('autoprefixer');
var WebpackNotifierPlugin = require('webpack-notifier');


var DEV = process.env.NODE_ENV !== 'production';


var definePlugin = new webpack.DefinePlugin({
    __DEV__: DEV,
    __SERVER__: false,
   "process.env": {
        // This has effect on the react lib size
        "NODE_ENV": JSON.stringify(process.env.NODE_ENV)
    }
});

var plugins = [
        definePlugin,
        // extract inline css into separate 'styles.css'
        new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /en-nz/),
        new ExtractTextPlugin(DEV ? '../css/[name].css' : '../css/[name].[hash].css'),
        new webpack.optimize.DedupePlugin(),
        new CopyWebpackPlugin([
                { from: '*.*', to: '../'  },
                { from: 'images/*.*',  to: '../'}
        ])
    ];

if(!DEV){
    plugins.push(new webpack.optimize.UglifyJsPlugin({
            compress: {
              warnings: false
            }
    }));
    plugins.push(function() {
        this.plugin("done", function(stats) {
          require("fs").writeFileSync(
            path.join(__dirname, "stats.json"),
            JSON.stringify({hash: stats.hash}));
        });
  })

}
else{
    plugins.push(new WebpackNotifierPlugin({
            title: 'Good Companies',
            alwaysNotify: true
    }))
}

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
        filename: DEV ? "[name].js" : "[name].[hash].js",
        path: __dirname + "/.tmp/public/js"
    },
    devtool: DEV ? 'source-map' : null,
    module: {
        loaders: [
        {
            test: /\.js$/,
            //exclude: /node_modules/,
            include: [
                path.resolve(__dirname, "assets"),
                path.resolve(__dirname, "api"),
                path.resolve(__dirname, "test"),
                path.resolve(__dirname, "workers"),
                path.resolve(__dirname, "cluster.js"),
                path.resolve(__dirname, "node_modules/react-shuffle")
            ],
            loader: "babel"
        }, /*, {
            test: /(\.jsx|\.js)$/,
            loader: "eslint-loader",
            exclude: /node_modules/
        }, */
        {
            test: /\.(scss|css)$/,
            loader: ExtractTextPlugin.extract(
                // activate source maps via loader query
                'css?sourceMap!' +
                'postcss-loader?sourceMap!' +
                'sass?sourceMap'
            )
        }, {
            test: /\.gif$/,
            loader: "url-loader?mimetype=image/gif"
        }, {
            test: /\.json$/,
            loader: "json-loader"
        }, {
            test: /\.(png|jpg)$/,
            loader: 'url-loader?limit=28000&name=../images/[name].[ext]'
            //loader: "file?name=../images/[name].[ext]"
        }, {
            test: /\.(svg|woff|woff2|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
            loader: DEV ? "file?name=../css/[name].[ext]" : "file?name=../css/[name].[ext]"
        }
        ],
    },
    postcss: [autoprefixer({browsers: ['> 0.01%', 'ie 8-10']})],
    plugins: plugins
}
