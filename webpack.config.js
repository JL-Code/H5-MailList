const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");

module.exports = {
  entry: {
    app: "./src/index.js"
  },
  devtool: "inline-source-map",
  // devServer 对象告知 webpack-dev-server，在 localhost:8080 下建立服务，将 dist 目录下的文件，作为可访问文件。
  // 配合在package.json scripts中添加 "start": "webpack-dev-server --open" 运行命令：npm run start
  devServer: {
    contentBase: "./dist",
    disableHostCheck: true, //禁用主机检查
    host: "0.0.0.0",
    allowedHosts: [],
    // 代理
    proxy: {
      "/api": {
        target: "http://meunsc.oicp.net:47941/",
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
    // The filename to be used while resolving directories.
    mainFiles: ["index"],
    // 自动补全下列扩展名
    extensions: [" ", ".js", ".art", ".json", ".less", ".css"]
  },
  plugins: [
    // NamedModulesPlugin，以便更容易查看要修补(patch)的依赖。
    new webpack.NamedModulesPlugin(),
    // 启用 HMR。（HotModuleReplacement）
    new webpack.HotModuleReplacementPlugin(),
    // 每次build时 清理dist目录
    new CleanWebpackPlugin(),
    // 用于生成 index.html
    new HtmlWebpackPlugin({
      title: "H5 MailList Component",
      filename: "index.html",
      template: path.resolve(__dirname, "index.html")
    })
  ],
  // 各种loader
  module: {
    rules: [
      {
        test: /\.less$/,
        use: ["style-loader", "css-loader", "less-loader"]
      },
      //style css loader
      {
        // 匹配模式
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      },
      //art-template loader
      {
        // 匹配模式
        test: /\.art$/,
        use: ["art-template-loader"]
      },
      // 加载图片
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: ["file-loader"]
      }
    ]
  },
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist")
  }
};
