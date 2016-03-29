import ProgressBar from 'progress';
import chalk from 'chalk';
import strip from '../../jsutils/strip';
import {
  resolve as resolvePath,
  join as joinPath,
} from 'path';

export const HOOKS = {
  newOAuthProvider: { isReqired: false },
  onInvalidPassword: { isReqired: false },
  onLogin: { isReqired: false },
  onLogout: { isReqired: false },
};

export async function checkHooks(options, config) {
  const {
    build: buildDirectory,
    hooks: hooksDirectory,
  } = config;
  const rootDirectory = config.root || '';

  const progress = new ProgressBar(' checking hooks [:bar] :percent :etas',
    {
      width: 20,
      total: 1 + Object.keys(HOOKS).length,
      clear: true
    });
  progress.tick(1);

  const errors = Object.keys(HOOKS).reduce(
    (acc, hook) => {
      const file =
        joinPath(rootDirectory, buildDirectory, hooksDirectory, hook + '.js');
      const filePath = resolvePath(file);

      let thisModule = null;
      try {
        delete require.cache[require.resolve(filePath)];
        thisModule = require(filePath);
      } catch (e) {
        progress.tick(1);
        return HOOKS[hook].isReqired ?
          acc.concat(`Hook "${file}" is not found.`) :
          acc;
      }

      if (thisModule && typeof thisModule[hook] !== 'function') {
        progress.tick(1);
        return acc.concat(`Hook "${file}" does not export "${hook}" function.`);
      }

      progress.tick(1);
      return acc;
    }, [ ]);

  if (errors.length) {
    errors.forEach(error =>
      console.log(strip`
        | ${chalk.bgRed('Error')} ${error}
        |
        |`));

    return false;
  }

  return true;
}
