const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const fs = require('fs');

// Build copy patterns based on existing directories
const copyPatterns = [];

// Check if directories exist before adding them to copy patterns
if (fs.existsSync(path.resolve(__dirname, 'src/css'))) {
  copyPatterns.push({ from: 'src/css', to: 'css' });
}

if (fs.existsSync(path.resolve(__dirname, 'src/img'))) {
  copyPatterns.push({ from: 'src/img', to: 'img' });
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
      filename: 'index.html',
      inject: 'body'
    }),
    ...(copyPatterns.length > 0 ? [new CopyWebpackPlugin({ patterns: copyPatterns })] : [])
  ],
  externals: {
    // Mark these as external since they're loaded via CDN
    'jquery': 'jQuery',
    'chess.js': 'Chess',
    '@chrisoakman/chessboardjs': 'Chessboard'
  }
};
