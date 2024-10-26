const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");
const webpack = require("webpack");

const sharedConfig = {
  resolve: {
    extensions: [".ts", ".js"],
    fallback: {
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
      buffer: require.resolve("buffer/"),
      util: require.resolve("util/"),
      process: require.resolve("process/browser"),
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: "ts-loader",
            options: {
              transpileOnly: true,
              compilerOptions: {
                noEmit: false,
                module: "esnext",
                target: "es2020",
              },
            },
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
      process: "process/browser",
    }),
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify(
        process.env.NODE_ENV || "production"
      ),
      "process.env.DEBUG": JSON.stringify(process.env.DEBUG || false),
    }),
  ],
};

module.exports = [
  {
    mode: "production",
    entry: ["buffer", "./src/index.ts"],
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "bulkie.min.js",
      library: "Bulkie", // Changed this
      libraryTarget: "umd", // Changed to use libraryTarget instead of library.type
      libraryExport: "Bulkie", // Removing this export the whole library
      globalObject: "this",
    },
    ...sharedConfig,
  },
  {
    mode: "production",
    entry: ["buffer", "./src/index.ts"],
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "bulkie-browser.min.js",
      library: "BulkieBrowser", // Changed this
      libraryTarget: "umd", // Changed to use libraryTarget instead of library.type
      libraryExport: "BulkieBrowser", // Removing this export the whole library
      globalObject: "this",
    },
    ...sharedConfig,
  },
];
