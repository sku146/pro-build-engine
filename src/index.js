import webpack from 'webpack';
import webpackMerge from 'webpack-merge';
import utils from './utils';
import helpers from './helpers';
import constants from './constants';

export default {
  webpackMerge,
  webpack,
  ...utils,
  ...helpers,
  ...constants,
};
