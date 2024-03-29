
/* global __dirname process */
const webpack = require('webpack');
const path = require('path');
const {merge} = require('webpack-merge');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
// const FlowWebpackPlugin = require('flow-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const {StatsWriterPlugin} = require('webpack-stats-plugin');
const Visualizer = require('webpack-visualizer-plugin2');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;


const LIBRARY_NAME = 'dk';

const plugins = [
    new HtmlWebpackPlugin({
        filename: path.resolve(__dirname, 'dkdj/templates/dkdj/include-scripts.html'),
        inject: false,
        minify: false,
        template: path.resolve(__dirname, 'src/html-webpack-plugin-django-template.html')
    }),
    new MiniCssExtractPlugin({
        // Options similar to the same options in webpackOptions.output
        // both options are optional
        filename: process.env.DKBUILD_TYPE === 'PRODUCTION' ? "[name].[contenthash].css" : "[name].css",
        // filename: "[name].css",
        chunkFilename: "[id].css"
    }),
    // new StatsWriterPlugin({
    //     filename: path.join('../../../../build', 'stats', 'log.json'),
    //     fields: null,
    //     stats: { chunkModules: true },
    // }),
 
    // new Visualizer({
    //     filename: path.join('../../../../build', 'stats', 'statistics.html'),
    // }),
    // new FlowWebpackPlugin({
    //     verbose: true,
    //     printFlowOutput: true,
    //     reportingSeverity: 'warning'
    // })
];

if (process.env.JSANALYZE === '1') {
    plugins.push(new BundleAnalyzerPlugin());
}


const common_settings = {
    entry: {
        dkdj: './src/index.js',
        // dkcss: './styles/index.scss',
    },
    target: 'web',

    output: {
        path: path.resolve(__dirname, 'dkdj/static/dkdj/js'),
        filename: '[name].min.js',
        chunkFilename: '[name].bundle.js',
        library: LIBRARY_NAME,
        libraryTarget: "var",
        
        libraryExport: 'default',
        
        // libraryTarget: "umd",
        // umdNamedDefine: true,
        // globalObject: `(typeof self !== 'undefined' ? self : this)`,
    },
    
    optimization: {
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    output: {
                        semicolons: false
                    },
                    // mangle: false,
                    keep_fnames: true,
                    keep_classnames: true
                }
            })
        ] 
    },

    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        cacheDirectory: true
                        // presets: ["@babel/preset-env"]
                    }
                }
            },
            {
                test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
                loader: 'url-loader',
                options: {
                    limit: 10000,
                },
            },
            {
                test: /\.scss$/,
                use: [
                    // fallback to style-loader in development
                    // {loader: process.env.NODE_ENV !== 'production' ? 'style-loader' : MiniCssExtractPlugin.loader},
                    // {loader: process.env.NODE_ENV === 'production' ? 'style-loader' : MiniCssExtractPlugin.loader},
                    // {loader: "css-loader", options: {sourceMap: true}},
                    "css-loader",
                    "postcss-loader",
                    {loader: "sass-loader", options: {sourceMap: true}},
                ]
            }
        ]
    },
    plugins,
    externals: {
        jquery: 'jQuery',
        "pusher-js": 'Pusher',
    }
};

const dev_settings = merge(common_settings, {
    mode: 'development',   // production, none
    //devtool: 'eval',        // generated code
    // devtool: 'eval-source-map',      // original source
    //devtool: 'eval-cheap-module-source-map',      // original source
    devtool: 'eval-source-map',

    output: {
        filename: '[name].min.js',
    },
});

const prod_settings = merge(common_settings, {
    mode: 'production',
    devtool: 'source-map',

    output: {
        filename: '[name].[contenthash].min.js',
        // filename: '[name].min.js',
    }
});

const npm_settings = {
    // mode: 'production',
    mode: 'development',
    entry: {
        dk: './src/index.js',
    },
    // devtool: 'eval-source-map',
    // devtool: 'eval-cheap-source-map',
    // devtool: 'inline-module-source-map',
    // devtool: 'eval-source-map',
    devtool: 'source-map',
    target: 'node16.5',
    // target: 'node',
    // target: 'browserslist',                 // self is not defined
    // target: 'es2020',
    // target: 'web',                      // self not defined

    output: {
        path: path.resolve(__dirname, 'lib/'),
        filename: '[name].js',
        library: {
            name: LIBRARY_NAME,
            export: 'default',
            type: 'umd',
            // type: 'commonjs2',
            umdNamedDefine: true,
        },
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        cacheDirectory: true
                    }
                }
            },
            {
                test: /\.scss$/,
                use: [
                    // fallback to style-loader in development
                    // {loader: process.env.NODE_ENV !== 'production' ? 'style-loader' : MiniCssExtractPlugin.loader},
                    // {loader: process.env.NODE_ENV === 'production' ? 'style-loader' : MiniCssExtractPlugin.loader},
                    {loader: "css-loader", options: {sourceMap: true}},
                    {loader: "postcss-loader", options: {}},
                    {loader: "sass-loader", options: {sourceMap: true}},
                ]
            }
        ]
    },
    plugins: [],
    externals: {
        // jquery: 'jQuery',
        // "pusher-js": 'Pusher',
    }
};


module.exports = (function (build) {
    let res = null;
    // console.log("BUILD:", build);
    switch (build) {
        case 'PRODUCTION':
            res = prod_settings;
            break;
        case 'NPM':
            res = npm_settings;
            new webpack.ProvidePlugin({
                $: 'jquery',
                jQuery: 'jquery',
            });
            break;
        default:
            res = dev_settings;
    }
    // console.log("RES:", res);
    return res;
})(process.env.DKBUILD_TYPE);
