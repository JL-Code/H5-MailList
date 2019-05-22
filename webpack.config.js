const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer")
  .BundleAnalyzerPlugin;
// const os = require("os");

//获取本机IP,当IP 设置为本机IP 后, 局域网内其它人可以通过 IP+端口,访问本机开发环境.

// function getLocalIps(flagIpv6) {
//   var ifaces = os.networkInterfaces();
//   var ips = [];
//   var func = function (details) {
//     if (!flagIpv6 && details.family === "IPv6") {
//       return;
//     }
//     ips.push(details.address);
//   };
//   for (var dev in ifaces) {
//     ifaces[dev].forEach(func);
//   }
//   return ips;
// }

module.exports = {
  entry: {
    app: "./src/index.js"
  },
  devtool: "inline-source-map",
  // devServer 对象告知 webpack-dev-server，在 localhost:8080 下建立服务，将 dist 目录下的文件，作为可访问文件。
  // 配合在package.json scripts中添加 "start": "webpack-dev-server --open" 运行命令：npm run start
  devServer: {
    contentBase: "./dist",
    // disableHostCheck: true, //禁用主机检查
    // host: getLocalIps()[0],
    host: "0.0.0.0",
    useLocalIp: true,
    port: 8088,
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
    }),
    // 引入 webpack 打包分析插件 https://www.jianshu.com/p/e85d6a4f68c0
    new BundleAnalyzerPlugin()
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
      },
      {
        test: /\.html$/,
        use: ["html-loader"]
      }
    ]
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "maillist.js",
    // 暴露 library refs:https://www.webpackjs.com/guides/author-libraries/
    library: "maillist",
    /**
     * 变量：作为一个全局变量，通过 script 标签来访问（libraryTarget:'var'）。
      this：通过 this 对象访问（libraryTarget:'this'）。
      window：通过 window 对象访问，在浏览器中（libraryTarget:'window'）。
      UMD：在 AMD 或 CommonJS 的 require 之后可访问（libraryTarget:'umd'）。
     */
    libraryTarget: "umd"
    // refs:https://webpack.js.org/configuration/output/#outputglobalobject
    // globalObject: 'this'
  },
  // 外部化 lodash 不打包lodash
  externals: {
    lodash: {
      commonjs: "lodash",
      commonjs2: "lodash",
      amd: "lodash",
      root: "_"
    },
    axios: "axios",
    weui: "weui"
  }
};
