import chalk from 'chalk';
import { join as joinPath } from 'path';
import values from '../../jsutils/values';

import { clearBuild } from './clearBuild';
import { analyzeSchema } from './analyzeSchema';
import { listFiles } from './listFiles';
import { lintFiles } from './lintFiles';
import { transpileFiles } from './transpileFiles';
import { copyFiles } from './copyFiles';
import { checkMutations } from './checkMutations';
import { checkPermissions } from './checkPermissions';
import { checkHooks } from './checkHooks';
import { loadConfig } from '../common';

export async function build(options, preloadedConfig) {
  const config = preloadedConfig ? preloadedConfig : await loadConfig();

  const {
    build: buildDirectory,
    schema: schemaFile,
  } = config;
  const rootDirectory = config.root || '';

  const dryRun = Boolean(options.dryRun);

  const CLEARSCREEN = '\u001b[2J';

  process.stdout.write(CLEARSCREEN);

  if (!dryRun) {
    console.log(chalk.bgGreen(` building... `));
    await clearBuild(joinPath(rootDirectory, buildDirectory));
  } else {
    console.log(chalk.bgGreen(` build dry run... `));
  }

  // analyzing schema
  console.log(`\n ` + chalk.magenta(`analyzing schema... `));
  const schema = await analyzeSchema(schemaFile, options, config);
  if (schema) {
    console.log(chalk.green(
      ` successfully analyzed ${Object.keys(schema).length} schema elements.`));
  } else {
    return false;
  }

  // pick up all js files for transpilation and linting
  const jsGlob = joinPath(rootDirectory, '**/*.js');
  const jsonGlob = joinPath(rootDirectory, '**/*.json');
  const ignoreGlob = joinPath(rootDirectory, '**/node_modules/**');
  const jsFiles = await listFiles(jsGlob, ignoreGlob);
  const jsonFiles = (await listFiles(jsonGlob, ignoreGlob))
    .filter(fileName => fileName !== 'package.json');

  // lint .js files using eslint
  console.log(`\n ` + chalk.magenta(`linting... `));
  if (await lintFiles(jsFiles)) {
    console.log(chalk.green(
      ` successfully linted ${jsFiles.length} files.`));
  } else {
    return false;
  }

  // transpile .js files using babel
  console.log(`\n ` + chalk.magenta(`transpiling... `));
  if (await transpileFiles(jsFiles, options, config)) {
    console.log(chalk.green(
      ` successfully transpiled ${jsFiles.length} files.`));
  } else {
    return false;
  }

  // copy json files into build directory, if any
  if (jsonFiles.length && !dryRun) {
    console.log(`\n ` + chalk.magentda(`copying json files... `));

    if (await copyFiles(jsonFiles, options, config)) {
      console.log(chalk.green(
        ` successfully copied ${jsonFiles.length} json files.`));
    } else {
      return false;
    }
  }

  // check if all mutations are accounted for
  const numberOfMutations = values(schema)
    .filter(type => type.kind === 'mutation')
    .length;

  if (numberOfMutations) {
    console.log(`\n ` + chalk.magenta(`checking mutations... `));

    if (await checkMutations(schema, options, config)) {
      console.log(chalk.green(
        ` all ${numberOfMutations} mutations are present and accounted for.`));
    } else {
      return false;
    }
  }

  // check hooks
  console.log(`\n ` + chalk.magenta(`checking hooks... `));

  if (await checkHooks(options, config)) {
    console.log(chalk.green(` done with hooks checkup.`));
  } else {
    return false;
  }

  // check permissions
  console.log(`\n ` + chalk.magenta(`checking permissions... `));

  if (await checkPermissions(schema, options, config)) {
    console.log(chalk.green(` done with permissions checkup.`));
  } else {
    return false;
  }

  console.log();

  return true;
}
