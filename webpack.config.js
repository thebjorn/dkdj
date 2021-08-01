
/* global __dirname process */
const webpack = require('webpack');
const path = require('path');
const {merge} = require('webpack-merge');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
// const FlowWebpackPlugin = require('flow-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const LIBRARY_NAME = 'dk';

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
    plugins: [
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
        })
        // new FlowWebpackPlugin({
        //     verbose: true,
        //     printFlowOutput: true,
        //     reportingSeverity: 'warning'
        // })
    ],
    externals: {
        jQuery: 'jquery',
        pusher: 'pusher',
    }
};

const dev_settings = merge(common_settings, {
    mode: 'development',   // production, none
    //devtool: 'eval',        // generated code
    // devtool: 'eval-source-map',      // original source
    devtool: 'eval-cheap-module-source-map',      // original source

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
    mode: 'production',
    entry: {
        dkdj: './src/index.js',
    },
    // devtool: 'source-map',
    target: 'node',
    output: {
        path: path.resolve(__dirname, 'lib/'),
        filename: '[name].js',
        library: LIBRARY_NAME,
        libraryTarget: 'umd',
        umdNamedDefine: true,
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
                    // {loader: "css-loader", options: {sourceMap: true}},
                    {loader: "postcss-loader", options: {
                        plugins: [
                            require('autoprefixer')
                        ]
                    }},
                    {loader: "sass-loader", options: {sourceMap: true}},
                ]
            }
        ]
    },
    plugins: [],
    externals: {
        jQuery: 'jquery',
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
            break;
        default:
            res = dev_settings;
    }
    // console.log("RES:", res);
    return res;
})(process.env.DKBUILD_TYPE);
