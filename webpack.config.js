const path = require('path');
module.exports = env => {
  const Dotenv = require('dotenv-webpack');

  return {
    mode: 'development',
    watch: true,
    entry: './src/index.js',
    output: {
      filename: 'bundle.js',
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