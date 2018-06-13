import webpack from 'webpack';
import assignIn from 'lodash/assignIn';
import UglifyJsPlugin from 'uglifyjs-webpack-plugin';
import VersionTemplatePlugin from './plugins/version-template-plugin';
import { common as commonConfigs } from '../configs';

const common = [];

const development = [
  new webpack.NamedModulesPlugin(),
  new webpack.HotModuleReplacementPlugin(),
  ...common,
];

const production = [
  ...common,
  new UglifyJsPlugin(assignIn({}, {
    test: /\.jsx($|\?)/i,
    uglifyOptions: {
      ecma: 5,
      output: {
        comments: true,
        beautify: false,
      },
    },
  }, commonConfigs.prodBunldeOptions || {})),
];

export default {
  development,
  production,
  VersionTemplatePlugin,
};
