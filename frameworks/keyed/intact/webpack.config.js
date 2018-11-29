const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
module.exports = {
    entry: {
        app: path.resolve(__dirname, './main.js')
    },
    // mode: 'development',
    mode: 'production',
    output: {
        path: path.resolve(__dirname, './dist'),
        chunkFilename: "[chunkhash:8].chunk.js"
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                // loader: 'babel-loader',
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            "presets": [["es2015", {"loose": true}], "stage-0"],
                            "plugins": [
                                "transform-decorators-legacy",
                                // "transform-es3-property-literals",
                                // "transform-es3-member-expression-literals",
                                // "transform-remove-strict-mode",
                            ]
                        }
                    }
                ]
            },
            {
                test: /\.vdt$/,
                use: [
                    {
                        loader: 'babel-loader',
                    },
                    {
                        loader: 'vdt-loader',
                        options: {
                            skipWhitespace: true,
                            noWith: true,
                            delimiters: ['{{', '}}']
                        }
                    }
                ]
            }
        ]
    },
    resolve: {
        extensions: ['.js', '.vdt']
    },
    plugins: [
        // new HtmlWebpackPlugin({
        //     template: path.resolve(__dirname, './index.html'),
        // })
    ]
};