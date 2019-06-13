const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const UglifyJSPlugin = require("uglifyjs-webpack-plugin"); //文件压缩
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer")
  .BundleAnalyzerPlugin; //webpack 打包分析

module.exports = {
  entry: "./src/maillist/index.js",
  mode: "production",
  output: {
    path: path.resolve(__dirname, "./dist"),
    filename: "makit.js",
    libraryTarget: "umd",
    library: "makit"
  },
  devtool: "source-map",
  devServer: {
    // https://webpack.js.org/configuration/dev-server/#devserver-stats-)
    stats: {
      all: false,
      modules: true,
      maxModules: 0,
      errors: true,
      warnings: true
    },
    contentBase: path.resolve(__dirname, "./public"),
    host: "0.0.0.0",
    useLocalIp: true,
    port: 8088,
    // 代理
    proxy: {
      "/api": {
        // target: "http://meunsc.oicp.net:47941/",
        target: "http://demo.highzap.com:8032/",
        changeOrigin: true,
        ws: true,
        pathRewrite: {
          "^/api": "/api"
        }
      }
    },
    hot: true // 启用热重载，局部刷新而不用全部刷新
  },
  // 解析配置
  resolve: {
    mainFiles: ["index"],
    extensions: [" ", ".js", ".art", ".json", ".less", ".css"]
  },
  // 各种loader
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"]
          }
        }
      },
      {
        test: /\.less$/,
        use: ["style-loader", "css-loader", "less-loader"]
      },
      {
        // 匹配模式
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      },
      {
        // 匹配模式
        test: /\.art$/,
        use: ["art-template-loader"]
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: ["file-loader"]
      },
      {
        test: /\.html$/,
        use: ["html-loader"]
      }
    ]
  },
  plugins: [
    new webpack.NamedModulesPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      title: "H5 MailList Component",
      filename: "index.html",
      template: path.resolve(__dirname, "index.html")
    }),
    // new UglifyJSPlugin(),
    // new BundleAnalyzerPlugin()
  ]
};
