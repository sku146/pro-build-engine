import filter from 'lodash/filter';
import isEmpty from 'lodash/isEmpty';
import map from 'lodash/map';
import split from 'lodash/split';
import includes from 'lodash/includes';
import isArray from 'lodash/isArray';
import flattenDeep from 'lodash/flattenDeep';
import {
  development,
  production,
  eslintConfig,
  common,
} from '../configs';
import {
  MSG,
  CLI_COMMAND,
  ENV,
  DEFAULT_VALUE,
  CLI_PATH,
} from '../constants';
import {
  isValidTask,
  validateLintExecute,
  exitError,
  exec,
  series,
} from './webpack';
import {
  getJourneyBrandPath,
  isJourneyActive,
} from '../utils';

const executeHelp = () => {
  exec(CLI_COMMAND.help, (err) => {
    if (err) {
      exitError(err);
    }
  });
};

const getServerCommand = (dirName = '') => {
  process.env.NODE_ENV = ENV.DEV;
  process.env.BABEL_ENV = ENV.DEV;
  return CLI_COMMAND.server()(dirName);
};

const getTechDocCommand = () => {
  const docResult = isValidTask('doc');
  if (docResult && !docResult.status) {
    exitError(docResult.msg);
  }
  return CLI_COMMAND.docGen;
};

const getReportCommand = () => {
  const esLintResult = isValidTask('eslint');
  if (esLintResult && !esLintResult.status) {
    exitError(esLintResult.msg);
  }
  if (isEmpty(eslintConfig.base)) {
    return MSG.LINT_EMPTY;
  }
  return CLI_COMMAND.eslintReport()(eslintConfig.base[0]);
};

const getMockServerCommand = (program = {}, dirName = '') => {
  const mockResult = isValidTask('mock');
  if (mockResult && !mockResult.status) {
    exitError(mockResult.msg);
  }
  const path = CLI_PATH.MOCK_CONFIG_PATH;

  if (program.mockServer === DEFAULT_VALUE.MOCK) {
    return CLI_COMMAND.mockServer()(path);
  }
  return CLI_COMMAND.mockServerWatch()(path);
};

const getBuildCommand = (program = {}, dirName = '') => {
  if (program.build === ENV.PROD) {
    process.env.NODE_ENV = ENV.PROD;
    process.env.BABEL_ENV = ENV.PROD;
    const prod = production || {};
    const output = prod.output || {};
    return split(CLI_COMMAND.release()(dirName, `./${output.root}`), '&&');
  }
  process.env.NODE_ENV = ENV.DEV;
  process.env.BABEL_ENV = ENV.DEV;
  const dev = development || {};
  const output = dev.output || {};
  return split(CLI_COMMAND.build()(dirName, `./${output.root}`), '&&');
};

const getEslintTask = (items = [], key = '') => map(items, (item) => {
  const lints = {
    test: {
      command: CLI_COMMAND.eslintTest()(item),
      msg: MSG.LINT()(key),
    },
    style: {
      command: CLI_COMMAND.styleLint()(item),
      msg: MSG.LINT()(key),
    },
  };
  return lints[key] || { command: CLI_COMMAND.eslint()(item), msg: MSG.LINT()(key) };
});

const getEslintTasks = (configs = {}) => {
  const scopeConfigs = configs;
  if (isEmpty(scopeConfigs)) {
    return MSG.LINT_EMPTY;
  }
  return flattenDeep(map(scopeConfigs, (config, key) => getEslintTask(config, key)));
};

const getLintCommand = (program = {}) => {
  const lintTask = (program.lint === DEFAULT_VALUE.LINT) ? [
    'configs',
    'base',
    'test',
    'style',
  ] : [program.lint];
  validateLintExecute(lintTask);

  const lints = {
    all: getEslintTasks(eslintConfig),
    configs: getEslintTask(eslintConfig.configs || [], 'configs'),
    base: getEslintTask(eslintConfig.base || [], 'base'),
    test: getEslintTask(eslintConfig.test || [], 'test'),
    style: getEslintTask(eslintConfig.style || [], 'style'),
  };
  return lints[program.lint] || lints[DEFAULT_VALUE.LINT];
};

const getTestCommand = (program = {}) => {
  const testResult = isValidTask('test');
  if (testResult && !testResult.status) {
    exitError(testResult.msg);
  }
  process.env.NODE_ENV = ENV.TEST;
  process.env.BABEL_ENV = ENV.TEST;
  const commands = {
    unit: CLI_COMMAND.test,
    watch: CLI_COMMAND.testWatch,
    watchAll: CLI_COMMAND.testWatchAll,
  };
  return commands[program.test] || CLI_COMMAND.test;
};

const getScoutTask = (journey, brand = '', port = common.port) => {
  const rootPath = production.output.root;
  const mainPath = getJourneyBrandPath(isJourneyActive(ENV.PROD), journey, brand);
  const bundlePath = `${rootPath}/${mainPath}`;
  return {
    command: CLI_COMMAND.scout()(bundlePath, port),
    msg: MSG.SCOUT()(mainPath),
  };
};

const getScoutCommand = (program = {}) => {
  let { port } = common;
  port += 1;
  const { scout } = program;
  const splitValue = split(scout, '~');
  return (isArray(splitValue)) ?
    getScoutTask(splitValue[0], splitValue[1], port) : getScoutTask(splitValue, '', port);
};

const getOptions = args => filter(args, arg => includes(arg, '-'));

const executeCommand = (program = {}, args = [], dirName = '') => {
  if (isEmpty(program) || isEmpty(args) || isEmpty(dirName)) {
    return;
  }
  const options = getOptions(args);
  const executeOptions = {
    '-s': () => getServerCommand(dirName),
    '--server': () => getServerCommand(dirName),
    '--build': () => getBuildCommand(program, dirName),
    '-b': () => getBuildCommand(program, dirName),
    '-l': () => getLintCommand(program),
    '--lint': () => getLintCommand(program),
    '-t': () => getTestCommand(program),
    '--test': () => getTestCommand(program),
    '-c': () => getScoutCommand(program),
    '--scout': () => getScoutCommand(program),
    '-m': () => getMockServerCommand(program, dirName),
    '--mockServer': () => getMockServerCommand(program, dirName),
    '-r': () => getReportCommand(),
    '--checkStyle': () => getReportCommand(),
    '-d': () => getTechDocCommand(),
    '--doc': () => getTechDocCommand(),
  };
  const commands = flattenDeep(map(options, value => executeOptions[value]()));
  series(commands, (err) => {
    if (err) {
      exitError(err);
    }
  });
};

export default {
  executeHelp,
  executeCommand,
  getOptions,
  getTestCommand,
  getLintCommand,
  getEslintTasks,
  getEslintTask,
  getBuildCommand,
  getServerCommand,
};
