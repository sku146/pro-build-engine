import sysPath from 'path';
import forEach from 'lodash/forEach';
import isEmpty from 'lodash/isEmpty';
import isArray from 'lodash/isArray';
import isString from 'lodash/isString';
import isPlainObject from 'lodash/isPlainObject';
import compact from 'lodash/compact';
import map from 'lodash/map';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import FaviconsWebpackPlugin from 'favicons-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import CspHtmlWebpackPlugin from 'csp-html-webpack-plugin';
import merge from 'webpack-merge';
import { DEFAULT_VALUE, ENV, CLI_PATH } from '../constants';
import {
  getEnvConfig,
  getEnvWebpack,
  getBrands,
  getJourneyConfig,
  updateProperties,
  isJourneyActive,
  getFolderFilePath,
  getStyleOutputPath,
  getOutputPath,
  getReleaseVersionPath,
  getVersionFilename,
  getBaseOutputPath,
  getJourneyBrandPath,
} from './common';
import { rules, plugins } from '../helpers';

const getStyleValue = (styleEntry = {}, brand = '') => {
  if (isEmpty(styleEntry)) {
    return DEFAULT_VALUE.STYLESHEET;
  }
  if (isString(styleEntry) || isArray(styleEntry)) {
    return styleEntry;
  }
  if (isPlainObject(styleEntry)) {
    return styleEntry[brand] || DEFAULT_VALUE.STYLESHEET;
  }
  return DEFAULT_VALUE.STYLESHEET;
};

const getEntryValue = (env = ENV.DEV, ref, brand = '', journey = '') => {
  if (isEmpty(ref)) {
    return '';
  }
  const journeyConfig = getJourneyConfig(env, journey);
  const entryProps = journeyConfig.entry || {};
  if (isEmpty(journeyConfig) || isEmpty(entryProps)) {
    return '';
  }
  const entryValue = entryProps[ref];
  return (ref === 'styles') ? getStyleValue(entryValue, brand) : entryValue;
};

const getDefinePlugin = (env = ENV.DEV, journey = '', brand = '') => {
  const configs = getEnvConfig(env);
  const journeyConfig = getJourneyConfig(env, journey);
  const journeyBrandPath = getJourneyBrandPath(isJourneyActive(env), journey, brand);
  if (isEmpty(journeyConfig)) {
    return {};
  }
  const currentProperties = configs.brandProperties[brand] || configs.brandProperties.default;
  const properties = updateProperties(currentProperties, {
    basePath: (env === ENV.DEV) ? `${journeyBrandPath}/` : '/',
  });
  return new webpack.DefinePlugin({
    webpack: JSON.stringify(properties),
    'process.env': {
      BRAND: `"${brand}"`,
      NODE_ENV: JSON.stringify(process.env.NODE_ENV || env),
    },
  });
};

const getScoutTemplateConfig = (indexTemplateConfig = {}, basePath = '') => {
  const props = {
    ...indexTemplateConfig.props,
    scoutpath: `${CLI_PATH.RELEASE_PATH}`,
  };
  const rootPath = isEmpty(basePath) ? '' : `${basePath}/`;
  return {
    props,
    filename: `${rootPath}${indexTemplateConfig.filename || 'index.html'}`,
    template: indexTemplateConfig.template,
    inject: indexTemplateConfig.inject,
    minify: indexTemplateConfig.minify,
  };
};

const getTemplateConfig = (env = ENV.DEV, journey = '', brand = '') => {
  const journeyConfig = getJourneyConfig(env, journey);
  if (isEmpty(journeyConfig)) {
    return {};
  }
  const configs = getEnvConfig(env);
  const journeyBrandPath = getJourneyBrandPath(isJourneyActive(env), journey, brand);
  const currentProperties = configs.brandProperties[brand] || configs.brandProperties.default;
  const properties = updateProperties(currentProperties, {
    basePath: (env === ENV.DEV) ? `${journeyBrandPath}/` : '/',
    env,
    security: configs.security || {},
  });
  return {
    filename: journeyConfig.htmlOutput.fileName,
    template: sysPath.resolve(process.cwd(), journeyConfig.htmlOutput.template),
    props: properties,
    inject: configs.inject,
    minify: configs.htmlMinify || false,
  };
};

const getExtractTextSass = (env = ENV.DEV, journey = '') => {
  if (isEmpty(journey) || env === ENV.DEV) {
    return [];
  }
  const configs = getEnvConfig(env);
  const styleOutputPath = getStyleOutputPath(getFolderFilePath(env, journey))[0];
  if (isEmpty(styleOutputPath)) {
    return [];
  }
  const sName = (env === ENV.PROD && !configs.noHash) ? `${styleOutputPath.path}.[chunkhash]` : `${styleOutputPath.path}`;
  return [new MiniCssExtractPlugin({
    filename: `${sName}.css`,
  })];
};

const getOutput = (env = ENV.DEV, journey = '', brand = '') => {
  const configs = getEnvConfig(env);
  const fName = (env === ENV.PROD && !configs.noHash) ? '[name].[chunkhash]' : '[name]';
  const cName = (env === ENV.PROD && !configs.noHash) ? '[id].[chunkhash]' : '[id]';
  return {
    filename: `${fName}.js`,
    chunkFilename: `${cName}.js`,
    publicPath: configs.publicPath,
    path: `${getBaseOutputPath(env, journey, brand)}/${getReleaseVersionPath(env)}`,
  };
};


const getEntry = (env = ENV.DEV, journey = '', brand = '') => {
  const paths = getOutputPath(getFolderFilePath(env, journey));
  const styleRef = compact([getEntryValue(env, 'styles', brand, journey)]);
  const entries = {};
  forEach(paths, (prop, idx) => {
    let value = getEntryValue(env, prop.ref, brand, journey);
    value = isString(value) ? [value] : value;
    if (!idx) {
      value = [
        ...value,
        ...styleRef,
      ];
    }
    entries[prop.path] = value;
  });
  return entries;
};

const getVersionPlugins = (env = ENV.DEV, journey = '', brand = '', templateConfig = {}) => {
  if (env === ENV.PROD) {
    const configs = getEnvConfig(env);
    const basePath = getBaseOutputPath(env, journey, brand);
    const versionFilename = getVersionFilename(env, basePath);
    const scoutTemplateConfig = getScoutTemplateConfig(templateConfig, basePath);
    return [
      new HtmlWebpackPlugin(scoutTemplateConfig),
      new CspHtmlWebpackPlugin(configs.security.contentSecurityPolicy, {
        hashingMethod: 'sha256',
        enabled: true,
      }),
      new plugins.VersionTemplatePlugin({
        filePath: versionFilename,
        noHash: configs.noHash,
        journey,
        brand,
      }),
    ];
  }
  return [];
};

const getCopyConfig = (env = ENV.DEV, journey = '') => {
  const journeyConfig = getJourneyConfig(env, journey);
  if (isEmpty(journeyConfig)) {
    return {};
  }
  return journeyConfig.copy || [];
};

const getWebpackConfigs = (env = ENV.DEV, journey = '', brand = '') => {
  if (isEmpty(journey)) {
    return {};
  }

  const configs = getEnvWebpack(env);
  const baseConfigs = getEnvConfig(env);
  const templateConfig = getTemplateConfig(env, journey, brand);
  const copyContent = getCopyConfig(env, journey);

  return merge.smart({
    entry: getEntry(env, journey, brand),
    output: getOutput(env, journey, brand),
    module: {
      rules: [
        ...rules[env],
      ],
    },
    plugins: [
      ...plugins[env],
      ...getExtractTextSass(env, journey),
      new HtmlWebpackPlugin(templateConfig),
      new FaviconsWebpackPlugin(baseConfigs.favIcon),
      ...getVersionPlugins(env, journey, brand, templateConfig),
      getDefinePlugin(env, journey, brand),
      new CopyWebpackPlugin(copyContent),
    ],
  }, configs);
};

const getBrandConfigs = (env = ENV.DEV, journey = '') => {
  if (isEmpty(journey)) {
    return {};
  }
  const brands = getBrands(env);
  const journeyConfig = getJourneyConfig(env, journey);
  if (isEmpty(journeyConfig)) {
    return {};
  }
  if (!isEmpty(brands) && !journeyConfig.noBrands) {
    return map(brands, brand => getWebpackConfigs(env, journey, brand));
  }
  return getWebpackConfigs(env, journey, '');
};

export default {
  getStyleValue,
  getEntryValue,
  getDefinePlugin,
  getTemplateConfig,
  getExtractTextSass,
  getOutput,
  getEntry,
  getWebpackConfigs,
  getBrandConfigs,
  getScoutTemplateConfig,
  getVersionPlugins,
};
