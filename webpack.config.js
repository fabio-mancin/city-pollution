const path = require('path');
module.exports = env => {
  const Dotenv = require('dotenv-webpack');

  return {
    mode: 'development',
    watch: true,
    entry: path.resolve(__dirname, 'src') + '/index.js',
    output: {
      filename: 'index.js',
      path: path.resolve(__dirname, 'dist'),
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
      new Dotenv()
    ]
  };
};