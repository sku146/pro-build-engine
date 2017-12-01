import sysPath from 'path';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import { CLI_PATH } from '../constants';
import {
  common as commonConfigs,
} from '../configs';

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
        limit: commonConfigs.assetsBundleLimit || 100000,
        name: 'fonts/[name].[ext]?[hash]',
      },
    }],
  },
  {
    test: /\.(gif|jpg|jpe?g|png)$/,
    use: [{
      loader: 'url-loader',
      options: {
        limit: commonConfigs.assetsBundleLimit || 100000,
        name: 'img/[name].[ext]?[hash]',
      },
    }],
  },
];

const development = [
  ...common,
  {
    test: /\.(scss|sass)$/,
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
    test: /\.(scss|sass)$/,
    loader: ExtractTextPlugin.extract({
      use: [{
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
      fallback: 'style-loader',
    }),
  },
  {
    test: /\.less$/,
    loader: ExtractTextPlugin.extract({
      use: [{
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
      fallback: 'style-loader',
    }),
  },
];

export default {
  development,
  production,
};

