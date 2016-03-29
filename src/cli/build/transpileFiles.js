import ProgressBar from 'progress';
import chalk from 'chalk';
import { resolve as resolvePath } from 'path';

import strip from '../../jsutils/strip';
import isNullish from '../../jsutils/isNullish';
import { transpile } from './transpile';
import { writeFile, mkdir } from '../common';


export async function transpileFiles(jsFiles, options, config) {
  const { build: buildDirectory } = config;
  const rootDirectory = config.root || '';
  const dryRun = Boolean(options.dryRun);

  const progress = new ProgressBar(' transpiling [:bar] :percent :etas', {
    width: 20,
    total: jsFiles.length + 1,
    clear: true
  });
  progress.tick(1);

  const errors = [ ];
  await Promise.all(
    jsFiles.map(async fileName => {
      let code = null;
      const targetFilePath =
        rootDirectory && fileName.startsWith(rootDirectory) ?
          resolvePath(rootDirectory, buildDirectory,
                      '.' + fileName.substr(rootDirectory.length)) :
          resolvePath(rootDirectory, buildDirectory, fileName);

      try {
        code = await transpile(fileName);
      } catch (error) {
        errors.push(strip`
          | ${chalk.bgRed(error.name)} in ${error.message}
          |
          |${error.codeFrame}
          |
          |`);
      }
      if (!dryRun && !isNullish(code)) {
        await mkdir(targetFilePath);
        await writeFile(targetFilePath, code);
      }
      progress.tick(1);
    }));

  if (errors.length) {
    errors.forEach(error => console.error(error));
    return false;
  }

  return true;
}
