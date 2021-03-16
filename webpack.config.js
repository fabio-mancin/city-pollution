const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = env => {
  const Dotenv = require('dotenv-webpack');

  return {
    mode: 'development',
    watch: true,
    entry: path.resolve(__dirname, './src') + '/index.js',
    output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname, './build'),
    },
    module: {
      rules: [{
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }, {
        test: /\.(png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/,
        use: 'file-loader'
      }],
    },
    plugins: [
      new Dotenv(),
      new webpack.optimize.UglifyJsPlugin(),
      new HtmlWebpackPlugin({
        inject: true,
        template:  path.resolve('./index.html'),
    }),
    ]
  };
};