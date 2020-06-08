/**
 * Created by OXOYO on 2019/5/31.
 *
 * cli 配置文件
 *
 * 文档：https://cli.vuejs.org/zh/config/
 */

const webpack = require('webpack')

module.exports = {
  // The basic URL when deploying the application package, leave blank to use relative path
  publicPath: '/XBoard/',
  // package output directory
  outputDir: 'docs',
  // Static resource directory
  assetsDir: '',
  productionSourceMap: false,
  // Development environment
  // devServer: {
  //   proxy: {
  // // proxy settings
  //     '/api': {
  //       target: '<url>',
  //       changeOrigin: true
  //     }
  //   }
  // }
  css: {
    loaderOptions: {
      less: {
        // Solve https://github.com/ant-design/ant-motion/issues/44 issues
        // related question：https://github.com/ant-design/ant-design/issues/7927#issuecomment-372513256
        javascriptEnabled: true
      }
    }
  },
  configureWebpack: {
    output: {
      // path: `${root}/public/assets/`,
      // publicPath: '/lead/assets',
      // filename: `${fileName()}.js`,
      chunkFilename: '[name].[chunkhash].js'
    }
  },
  chainWebpack: config => {
    config
      .plugin('provide')
      .use(webpack.ProvidePlugin, [{
        'window.Quill': 'quill'
      }]);
  }
}
