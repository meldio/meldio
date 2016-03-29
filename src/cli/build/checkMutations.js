import ProgressBar from 'progress';
import chalk from 'chalk';
import values from '../../jsutils/values';
import strip from '../../jsutils/strip';
import {
  resolve as resolvePath,
  join as joinPath,
} from 'path';


export async function checkMutations(schema, options, config) {
  const {
    build: buildDirectory,
    mutations: mutationsDirectory,
    schema: schemaFile,
  } = config;
  const rootDirectory = config.root || '';

  const numberOfMutations = values(schema)
    .filter(type => type.kind === 'mutation')
    .length;

  const progress = new ProgressBar(' checking mutations [:bar] :percent :etas',
    {
      width: 20,
      total: numberOfMutations + 1,
      clear: true
    });
  progress.tick(1);

  const missingMutations = values(schema)
    .filter(type => type.kind === 'mutation')
    .map(mutation => mutation.name)
    .reduce(
      (acc, mutation) => {
        const file = joinPath(rootDirectory, buildDirectory, mutationsDirectory,
                              mutation + '.js');
        const filePath = resolvePath(file);

        let thisModule = null;
        try {
          delete require.cache[require.resolve(filePath)];
          thisModule = require(filePath);
        } catch (e) {
          progress.tick(1);
          return acc.concat({
            mutation,
            reason: `File "${file}" not found.`
          });
        }

        if (typeof thisModule[mutation] !== 'function') {
          progress.tick(1);
          return acc.concat({
            mutation,
            reason: `File "${file}" does not export ${mutation} function.`
          });
        }

        progress.tick(1);
        return acc;
      },
      [ ]);

  if (missingMutations.length) {
    console.error(strip`
      | ${chalk.bgRed('Error')} Mutations are defined in ${schemaFile}, but
        ~ implementations are missing:
      |
      |${missingMutations.map(
          (m, i) => ` ${i + 1}. ${m.mutation}: ${m.reason}`).join('\n')}
      |
      |`);

    return false;
  }

  return true;
}
