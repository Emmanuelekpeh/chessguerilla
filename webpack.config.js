const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const fs = require('fs');

// Check if directories exist
const imgDirExists = fs.existsSync(path.resolve(__dirname, 'src/img'));
const cssDirExists = fs.existsSync(path.resolve(__dirname, 'src/css'));

// Prepare copy patterns
const copyPatterns = [];
if (imgDirExists) {
  copyPatterns.push({ from: 'src/img', to: 'img' });
}
if (cssDirExists) {
  copyPatterns.push({ from: 'src/css', to: 'css' });
}

module.exports = {
  entry: './src/js/main.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'js/bundle.[contenthash].js',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'index.html'
    }),
    ...(copyPatterns.length > 0 ? [new CopyWebpackPlugin({ patterns: copyPatterns })] : [])
  ]
};
