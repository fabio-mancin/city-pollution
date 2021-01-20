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
      }]
    },
    plugins: [
      new Dotenv()
    ]
  };
};