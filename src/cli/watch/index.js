import { resolve as resolvePath, join as joinPath } from 'path';
import strip from '../../jsutils/strip';
import values from '../../jsutils/values';
import chalk from 'chalk';
import chokidar from 'chokidar';

import {
  analyzeSchema,
  lintFiles,
  copyFiles,
  transpileFiles,
  checkMutations,
  checkPermissions,
  checkHooks,
  HOOKS,
} from '../build';

import { run } from '../run';
import { loadConfig, loadEnv } from '../common';
import { enableDestroy } from './enableDestroy';

export async function watch(options) {
  const RING_BELL = '\x07';
  const CLEARLINE = '\r\x1B[K';
  const CLEARSCREEN = '\u001b[2J';

  let config = await loadConfig();
  const rootDirectory = config.root || '';
  const {
    mutations: mutationsDirectory,
    permissions: permissionsFile,
    schema: schemaFile,
    build: buildDirectory,
  } = config;

  const envPath = rootDirectory ?
    resolvePath(joinPath(rootDirectory, '.env')) :
    resolvePath('.env');
  let env = await loadEnv(envPath);

  let server = await run(options, config, env);
  if (server) {
    enableDestroy(server);
  }

  const watchPaths = [
    '**/*.js',
    '**/*.json',
    schemaFile,
    '.env' ]
    .map(path => joinPath(rootDirectory || '.', path))
    .concat('package.json');

  const watchOptions = {
    ignored: [
      joinPath('**', buildDirectory, '**'),
      joinPath('**', 'node_modules', '**'),
    ],
    alwaysStat: true,
    ignoreInitial: true,
  };
  const watcher = chokidar.watch(watchPaths, watchOptions);
  watcher
    .on('ready', onReady)
    .on('add', onChange)
    .on('unlink', onDelete)
    .on('change', onChange);

  const onSignal = () => {
    watcher.close();
    if (server) {
      server.destroy( (error) => {
        if (error) {
          console.error(CLEARLINE + chalk.bgRed(' error stopping the server '));
          process.exit(1);
        } else {
          console.log(CLEARLINE +
            chalk.bgYellow(' stopped the server and watcher. '));
          process.exit(0);
        }
      });
    } else {
      console.log(CLEARLINE + chalk.bgYellow(' stopped the watcher. '));
      process.exit(0);
    }
  };

  process.on('SIGINT', onSignal);
  // process.on('SIGQUIT', onSignal);
  // process.on('SIGTERM', onSignal);

  let timeout;
  let isBuilding;
  let needsBuild;
  let buildSet = { };

  function onReady() {
    console.log(chalk.bgGreen(' watching... '));
  }

  function onChange(filepath, stat) {
    if (stat && !stat.isDirectory()) {
      buildSet[filepath] = true;
      debouncedBuild();
    }
  }

  function onDelete(filepath) {
    delete buildSet[filepath];
    debouncedBuild();
  }

  function debouncedBuild() {
    needsBuild = true;
    clearTimeout(timeout);
    timeout = setTimeout(guardedBuild, 250);
  }

  function guardedBuild() {
    if (isBuilding || !needsBuild) {
      return;
    }
    isBuilding = true;
    const filepaths = Object.keys(buildSet);
    buildSet = { };
    needsBuild = false;
    buildFiles(filepaths).then(() => {
      isBuilding = false;
      process.nextTick(guardedBuild);
    });
  }

  async function buildFiles(filePaths) {
    process.stdout.write(CLEARSCREEN);
    let success = true;

    let schema = null;
    if (filePaths.some(filePath =>
          filePath.includes(schemaFile) ||
          filePath.includes(mutationsDirectory) ||
          filePath.includes(permissionsFile))) {
      console.log(`\n ` + chalk.magenta(`analyzing schema... `));
      schema = await analyzeSchema(schemaFile, options, config);
      if (schema) {
        console.log(chalk.green(` schema looks good.`));
      } else {
        success = false;
      }
    }

    if (filePaths.includes('package.json')) {
      console.log(`\n ` + chalk.magenta(`reloading configuration... `));
      try {
        config = await loadConfig();
        console.log(chalk.green(` successfully reloaded configuration file.`));
      } catch (e) {
        console.error(strip`
          | ${chalk.bgRed('Error')} Failed loading package.json file:
          |
          | ${e.code ? e.code + ': ' : ''}${e.message}
          |
          |`);
        success = false;
      }
    }

    if (filePaths.some(filePath => filePath.includes('.env'))) {
      console.log(`\n ` + chalk.magenta(`reloading environment... `));
      try {
        env = await loadEnv(envPath);
        console.log(chalk.green(` successfully reloaded environment file.`));
      } catch (e) {
        console.error(strip`
          | ${chalk.bgRed('Error')} Failed loading .env file:
          |
          | ${e.code ? e.code + ': ' : ''}${e.message}
          |
          |`);
        success = false;
      }
    }

    const jsFiles = filePaths.filter(filePath => filePath.endsWith('.js'));
    const jsonFiles = filePaths
      .filter(filePath =>
        filePath.endsWith('.json') && filePath !== 'package.json');

    if (jsFiles.length) {
      console.log(`\n ` + chalk.magenta(`linting... `));
      if (await lintFiles(jsFiles)) {
        console.log(chalk.green(
          ` successfully linted ${jsFiles.length} files.`));
      } else {
        success = false;
      }

      if (success) {
        console.log(`\n ` + chalk.magenta(`transpiling... `));
        if (await transpileFiles(jsFiles, options, config)) {
          console.log(chalk.green(
            ` successfully transpiled ${jsFiles.length} files.`));
        } else {
          success = false;
        }
      }
    }

    if (jsonFiles.length) {
      console.log(`\n ` + chalk.magenta(`copying json files... `));

      if (await copyFiles(jsonFiles, options, config)) {
        console.log(chalk.green(
          ` successfully copied ${jsonFiles.length} json files.`));
      } else {
        success = false;
      }
    }

    if (success && schema) {
      const numberOfMutations = values(schema)
        .filter(type => type.kind === 'mutation')
        .length;

      if (numberOfMutations) {
        console.log(`\n ` + chalk.magenta(`checking mutations... `));

        if (await checkMutations(schema, options, config)) {
          console.log(chalk.green(
            strip` all ${numberOfMutations} mutations are present and
                 ~ accounted for.`));
        } else {
          success = false;
        }
      }
    }

    // check hooks
    const hasHooks =
      filePaths.some(path =>
        Object.keys(HOOKS).some(hook => path.endsWith(hook + '.js')));

    if (success && hasHooks) {
      console.log(`\n ` + chalk.magenta(`checking hooks... `));

      if (await checkHooks(options, config)) {
        console.log(chalk.green(` done with hooks checkup.`));
      } else {
        success = false;
      }
    }

    // check permissions
    if (success && schema) {
      console.log(`\n ` + chalk.magenta(`checking permissions... `));

      if (await checkPermissions(schema, options, config)) {
        console.log(chalk.green(` done with permissions checkup.`));
      } else {
        success = false;
      }
    }

    if (success) {
      if (server) {
        console.log(`\n` + chalk.magenta(` stopping the server... `));
        await server.destroy();
        console.log(chalk.green(' stopped the server '));
      }
      console.log();
      server = await run({ ...options, skipBuild: true }, config, env);
      enableDestroy(server);
      console.log('\n' + chalk.bgGreen(' watching... '));
    } else {
      process.stdout.write('\n' + RING_BELL + chalk.bgGreen(' watching... '));
    }
  }
}
