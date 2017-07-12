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
        new ExtractTextPlugin('../css/[name].[hash].css'),
        new CopyWebpackPlugin([
                { from: '*.*', to: '../'  },
                { from: 'images/*.*',  to: '../'},
                { from: '../node_modules/pdfjs-dist/build/pdf.worker.min.js', to: './'}
        ])
    ];

plugins.push(function() {
    this.plugin("done", function(stats) {
      require("fs").writeFileSync(
        path.join(__dirname, "stats.json"),
        JSON.stringify({hash: stats.hash}));
    });
})
if(!DEV){
    plugins.push(new webpack.optimize.UglifyJsPlugin({
        sourceMap: true,
        compress: {
          warnings: false
        }
    }));
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
    entry: {main: "./js/main.js"},
    target: "web",
    node: {
        __dirname: true,
        fs: 'empty'
    },
    output: {
        publicPath: '/js/',
        filename:  "[name].[hash].js",
        path: __dirname + "/.tmp/public/js"
    },
    devtool: 'source-map',
      resolve: {
        alias: {
          'react': path.join(__dirname, 'node_modules', 'react')
        },
        extensions: ['', '.js']
      },
    module: {
        rules: [
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
            loader: "babel-loader"
        },
        {
            test: /\.(scss|css)$/,
            use: ExtractTextPlugin.extract({use: [
                {
                    loader: 'css-loader',
                    options: {
                        importLoaders: true,
                        sourceMap: true
                    }
                },
                {
                    loader: 'postcss-loader',
                    options: {
                        sourceMap: true,
                        plugins: [
                            autoprefixer
                        ]
                    }
                },
                {
                    loader: 'sass-loader',
                    options: {
                        sourceMap: true
                    }
                }
            ]})
        },
        {
            test: /\.gif$/,
            use: [{ loader: "url-loader", options: {mimetype: "image/gif"}}]
        }, {
            test: /\.(png|jpg)$/,
            use: [{loader: "url-loader", options: {"limit": 28000, "name": "../images/[name].[ext]"}}]
        }, {
            test: /\.(svg|woff|woff2|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
            use: [{loader: "file-loader", options: {name: "../css/[name].[ext]"}}]
        }
        ],
    },
    resolve: {
        extensions: [".js", ".json"]
    },
    plugins: plugins
}
