const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: {
    lib: './lib/index.ts'
  },
  //watch: true,
  mode: 'development',
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  target: 'node',
  output: {
    //filename: '[name].[contenthash:8].js',
    libraryTarget: 'commonjs2',
    libraryExport: 'default',
    publicPath: '/',
    path: path.resolve(__dirname, './dist')
  }
};
