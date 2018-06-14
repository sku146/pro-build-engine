import sysPath from 'path';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { CLI_PATH, DEFAULT_VALUE } from '../constants';
import { common as commonConfigs } from '../configs';

const ROOT_DIR = sysPath.resolve(`${process.cwd()}`);

const common = [
  {
    test: /\.(js|jsx)$/,
    exclude: /node_modules/,
    use: ['babel-loader'],
  },
  {
    test: /\.(eot|svg|ttf|TTF|woff|woff2)$/,
    use: [{
      loader: 'url-loader',
      options: {
        limit: commonConfigs.assetsBundleLimit || DEFAULT_VALUE.ASSETS_LIMIT,
        name: 'fonts/[name].[ext]?[hash]',
      },
    }],
  },
  {
    test: /\.(gif|jpg|jpe?g|png)$/,
    use: [{
      loader: 'url-loader',
      options: {
        limit: commonConfigs.assetsBundleLimit || DEFAULT_VALUE.ASSETS_LIMIT,
        name: 'img/[name].[ext]?[hash]',
      },
    }],
  },
];

const development = [
  ...common,
  {
    test: /\.s?[ac]ss$/,
    use: [{
      loader: 'style-loader',
    }, {
      loader: 'css-loader',
      options: {
        sourceMap: true,
        importLoaders: 1,
      },
    }, {
      loader: 'resolve-url-loader',
    }, {
      loader: 'postcss-loader',
      options: {
        sourceMap: true,
        config: {
          path: CLI_PATH.POST_CSS_CONFIG_PATH,
        },
      },
    }, {
      loader: 'sass-loader',
      options: {
        includePaths: ['node_modules'],
        sourceMap: true,
      },
    }],
  },
  {
    test: /\.less$/,
    use: [{
      loader: 'style-loader',
    }, {
      loader: 'css-loader',
      options: {
        sourceMap: true,
        importLoaders: 1,
      },
    }, {
      loader: 'postcss-loader',
      options: {
        sourceMap: true,
        config: {
          path: CLI_PATH.POST_CSS_CONFIG_PATH,
        },
      },
    }, {
      loader: 'less-loader',
      options: {
        paths: [ROOT_DIR, CLI_PATH.NODE_MODULES],
        sourceMap: true,
      },
    }],
  },
];

const production = [
  ...common,
  {
    test: /\.s?[ac]ss$/,
    use: [MiniCssExtractPlugin.loader,
      {
        loader: 'css-loader',
        options: {
          minimize: true,
        },
      }, {
        loader: 'resolve-url-loader',
      }, {
        loader: 'postcss-loader',
        options: {
          sourceMap: true,
          config: {
            path: CLI_PATH.POST_CSS_CONFIG_PATH,
          },
        },
      }, {
        loader: 'sass-loader',
        options: {
          includePaths: ['node_modules'],
          sourceMap: true,
          sourceMapContents: true,
        },
      }],
  },
  {
    test: /\.less$/,
    use: [MiniCssExtractPlugin.loader,
      {
        loader: 'css-loader',
        options: {
          minimize: true,
          importLoaders: 1,
        },
      }, {
        loader: 'postcss-loader',
        options: {
          config: {
            path: CLI_PATH.POST_CSS_CONFIG_PATH,
          },
        },
      }, {
        loader: 'less-loader',
        options: {
          paths: [ROOT_DIR, CLI_PATH.NODE_MODULES],
        },
      }],
  },
];

export default {
  development,
  production,
};

