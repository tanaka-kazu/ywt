const path = require('path');
const os = require('os');

module.exports = {
  context: `${__dirname}/src`,
  entry: {
    ywtListView: ['babel-polyfill', './ywtListView.js'],
  },
  output: {
    path: path.join(os.homedir(), 'Dropbox/kintone/ywt'),
    filename: '[name].js',
  },
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          presets: [['env', {
            targets: { browsers: ['last 2 versions'] },
            modules: false,
          }]],
          plugins: ['transform-class-properties'],
        },
      },
      {
        test: /\.html$/,
        loader: 'html-loader',
      },
      {
        test: /\.css$/,
        loader: ['style-loader/useable', 'css-loader'],
      },
      {
        test: /\.scss$/,
        loader: ['style-loader/useable', 'css-loader', 'sass-loader'],
      },
      {
        test: path.join(__dirname, 'node_modules/kintone-utility/docs/kintoneUtility'),
        loader: 'exports-loader?kintoneUtility',
      },
    ],
  },
  resolve: {
    alias: {
      vue$: 'vue/dist/vue.esm.js',
    },
  },
};
