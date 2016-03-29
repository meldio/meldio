import ProgressBar from 'progress';
import chalk from 'chalk';
import codeFrame from 'babel-code-frame';
import { resolve as resolvePath } from 'path';

import strip from '../../jsutils/strip';
import { readFile } from '../common';
import { lintFile } from './lintFile';

export async function lintFiles(jsFiles) {
  // load up linter rules
  const lintConfigPath = resolvePath('.eslintrc');
  const lintConfigText = await readFile(lintConfigPath);
  const lintConfig = JSON.parse(lintConfigText);

  const progress = new ProgressBar(' linting [:bar] :percent :etas', {
    width: 20,
    total: jsFiles.length + 1,
    clear: true
  });
  progress.tick(1);

  const errors = [ ];
  await Promise.all(
    jsFiles.map(async fileName => {
      const filePath = resolvePath(fileName);
      const { lintResults, code } = await lintFile(filePath, lintConfig);
      if (lintResults && lintResults.length) {
        errors.push(
          ...lintResults.map(result => {
            const tag = chalk.bgRed(result.fatal ? 'fatal' : result.ruleId);
            const loc = `${result.line}:${result.column}`;
            const frame = codeFrame(code, result.line, result.column, {
              highlightCode: true,
            });
            return strip`
                        | ${tag} in ${fileName}: ${result.message} (${loc})
                        |
                        |${frame}
                        |
                        |`;
          }));

      }
      progress.tick(1);
    }));

  if (errors.length) {
    errors.forEach(error => console.error(error));
    return false;
  }

  return true;
}
