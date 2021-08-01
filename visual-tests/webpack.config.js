/* global __dirname process */
const webpack = require('webpack');
const path = require('path');
const merge = require('webpack-merge');
const HtmlWebpackPlugin = require('html-webpack-plugin');
// const FlowWebpackPlugin = require('flow-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const LIBRARY_NAME = 'dk';

const common_settings = {
    entry: [
        './src/index.js'
    ],
    target: 'web',

    output: {
        path: path.resolve(__dirname, 'js'),
        filename: '[name].js',
        chunkFilename: 'myapp.bundle.js',
        library: 'ColorLight',
        libraryTarget: "var",

        libraryExport: 'default',

        // libraryTarget: "umd",
        // umdNamedDefine: true,
        // globalObject: `(typeof self !== 'undefined' ? self : this)`,
    },

    // optimization: {
    //     minimizer: [
    //         new TerserPlugin({
    //             terserOptions: {
    //                 output: {
    //                     semicolons: false
    //                 },
    //                 // mangle: false,
    //                 keep_fnames: true,
    //                 keep_classnames: true
    //             }
    //         })
    //     ]
    // },

    module: {
        rules: [
            {
                test: /\.es6$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        cacheDirectory: true
                        // presets: ["@babel/preset-env"]
                    }
                }
            }
        ]
    },
    // plugins: [
    //     new HtmlWebpackPlugin({
    //         filename: path.resolve(__dirname, 'dkdj/templates/dkdj/include-scripts.html'),
    //         inject: false,
    //         template: path.resolve(__dirname, 'src/html-webpack-plugin-django-template.html')
    //     }),
    //     // new FlowWebpackPlugin({
    //     //     verbose: true,
    //     //     printFlowOutput: true,
    //     //     reportingSeverity: 'warning'
    //     // })
    // ],
    externals: {
        jQuery: 'jquery',
    }
};

const dev_settings = merge(common_settings, {
    mode: 'development',   // production, none
    devtool: 'eval',        // generated code
    // devtool: 'eval-source-map',      // original source
    // devtool: 'cheap-module-eval-source-map',      // original source

    output: {
        filename: '[name].js',
    },
});

const prod_settings = merge(common_settings, {
    mode: 'production',
    devtool: 'source-map',

    output: {
        // filename: '[name].[contenthash].min.js',
        filename: '[name].js',
    }
});


module.exports = process.env.DKBUILD_TYPE === 'PRODUCTION' ? prod_settings : dev_settings;

