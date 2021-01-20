const path = require('path');

module.exports = env => {
  const Dotenv = require('dotenv-webpack');
  //env.API_KEY = "4334065a21a9ec1c2e119676dd6eb433ae0e098d"

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