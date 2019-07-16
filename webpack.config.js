/* eslint-disable no-console */
const path = require("path");
const webpack = require("webpack");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const VueLoaderPlugin = require("vue-loader/lib/plugin");
const TerserPlugin = require("terser-webpack-plugin");
const Autoprefixer = require("autoprefixer");
const SpritesmithPlugin = require("webpack-spritesmith");

const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { LicenseWebpackPlugin } = require("license-webpack-plugin");

module.exports = {
    mode: "production",
    entry: {
        "init.js": path.join(__dirname, "src", "init.js"),
        "main.js": path.join(__dirname, "src", "main.js"),
        "index.css": path.join(__dirname, "src", "index.scss")
    },
    output: {
        path: path.join(__dirname, "static"),
        publicPath: "/static/",
        filename: "[name]",
        chunkFilename: "[hash:8].chunk"
    },
    module: {
        rules: [
            {
                enforce: "pre",
                test: /\.js$/,
                include: [path.resolve(__dirname, "src")],
                exclude: [path.resolve(__dirname, "node_modules")],
                loader: "eslint-loader"
            },
            {
                test: /\.js$/,
                include: [path.resolve(__dirname, "src")],
                loader: "babel-loader",
                query: {
                    presets: [["@babel/preset-env", { useBuiltIns: "usage", corejs: 3 }]],
                    plugins: [["@babel/plugin-proposal-pipeline-operator", { proposal: "minimal" }]]
                }
            },
            {
                test: /\.vue$/,
                include: [path.resolve(__dirname, "src")],
                loader: "vue-loader"
            },
            {
                test: /\.s?css$/,
                include: [path.resolve(__dirname, "src")],
                resolve: {
                    extensions: [".scss"]
                },
                use: [
                    MiniCssExtractPlugin.loader,
                    "css-loader",
                    {
                        loader: "postcss-loader",
                        options: {
                            ident: "postcss",
                            plugins: [Autoprefixer]
                        }
                    },
                    {
                        loader: "sass-loader",
                        options: {
                            includePaths: [path.join(__dirname, "src")]
                        }
                    }
                ]
            }
        ]
    },
    optimization: {
        minimizer: [
            new TerserPlugin({
                extractComments: false,
                sourceMap: false
            })
        ]
    },
    plugins: [
        new webpack.ProgressPlugin(),
        new CleanWebpackPlugin({
            verbose: false,
            cleanOnceBeforeBuildPatterns: ["init.js*", "main.js*", "index.css*"]
        }),
        new VueLoaderPlugin(),
        new MiniCssExtractPlugin({
            filename: "./[name]",
            chunkFilename: "./[hash:8].chunk"
        }),
        new SpritesmithPlugin({
            src: {
                cwd: path.join(__dirname, "static", "img"),
                glob: "{0..106}.jpg"
            },
            target: {
                image: path.join(__dirname, "static", "img", "sprite.png"),
                css: path.join(__dirname, "src", "sprite.scss")
            },
            apiOptions: {
                cssImageRef: "/img/sprite.png",
                generateSpriteName: fullPathToSourceFile => {
                    const { name } = path.parse(fullPathToSourceFile);
                    return `sprite-${name}`;
                }
            },
            spritesmithOptions: {}
        }),
        new LicenseWebpackPlugin({
            addBanner: true,
            excludedPackageTest: packageName =>
                ["loader", "webpack"].some(word => packageName.includes(word)),
            outputFilename: "[name].LICENSE"
        })
    ],
    resolve: {
        extensions: [".json", ".js"],
        modules: ["src", "node_modules"]
    },
    stats: "errors-only"
};
