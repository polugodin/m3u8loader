const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = (env = {}) => {
  const isDev = !!env.dev || process.env.NODE_ENV?.includes('dev')
  isDev && console.log('=== DEV MODE ===')

  return {
    context: path.resolve(__dirname, 'src'),
    mode: isDev ? 'development' : 'production',
    entry: {
      index: './index.ts',
    },
    output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname, 'dist'),
    },
    resolve: {
      extensions: ['.js', '.json', '.ts'],
    },
    devServer: {
      port: 8080,
      hot: isDev,
      client: {
        overlay: true,
      },
    },
    devtool: isDev ? 'source-map' : false,
    plugins: [
      new HtmlWebpackPlugin({template: 'index.html'}),
    ],
    performance: {
      hints: false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000,
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-typescript'],
            },
          },
        },
        {
          test: /\.s[ac]ss$/i,
          use: [
            // Creates `style` nodes from JS strings
            "style-loader",
            // Translates CSS into CommonJS
            "css-loader",
            // Compiles Sass to CSS
            "sass-loader",
          ],
        },
        // {
        //   test: /\.(png|jpg|gif)$/i,
        //   use: [
        //     {
        //       loader: 'url-loader',
        //       options: {
        //         limit: true,
        //       },
        //     },
        //   ],
        // },
      ],
    },
  }
}
