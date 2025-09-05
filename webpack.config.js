const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    service: './src/core/service.ts',
    dashboard: './src/interface/dashboard.ts',
    interceptor: './src/pages/interceptor.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'public/config.json', to: 'manifest.json' }
      ]
    }),
    new HtmlPlugin({
      template: './src/interface/dashboard.html',
      filename: 'dashboard.html',
      chunks: ['dashboard']
    }),
    new HtmlPlugin({
      template: './src/pages/interceptor.html',
      filename: 'interceptor.html',
      chunks: ['interceptor']
    })
  ]
};