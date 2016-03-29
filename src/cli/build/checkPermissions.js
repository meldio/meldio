import ProgressBar from 'progress';
import chalk from 'chalk';
import values from '../../jsutils/values';
import strip from '../../jsutils/strip';
import {
  resolve as resolvePath,
  join as joinPath,
} from 'path';


export async function checkPermissions(schema, options, config) {
  const {
    build: buildDirectory,
    permissions: permissionsFile,
    enabledAuth,
  } = config;
  const rootDirectory = config.root || '';

  const numberOfNodeTypes = values(schema)
    .filter(type => type.kind === 'type' && type.implementsNode)
    .length;

  const numberOfMutations = values(schema)
    .filter(type => type.kind === 'mutation')
    .length;

  const progress =
    new ProgressBar(' checking permissions [:bar] :percent :etas',
      {
        width: 20,
        total: numberOfNodeTypes + numberOfMutations + 1,
        clear: true
      });

  const file = joinPath(rootDirectory, buildDirectory, permissionsFile);
  const filePath = resolvePath(file);
  let permissionsModule = null;
  try {
    delete require.cache[require.resolve(filePath)];
    permissionsModule = require(filePath);
  } catch (e) {
    if (enabledAuth.length === 0) {
      console.log(strip`
        | ${chalk.bgYellow('Warning')} ${permissionsFile} file is missing.
        |
        |`);

      return true;
    }
    console.error(strip`
      | ${chalk.bgRed('Error')} ${permissionsFile} file is missing.
      |
      |`);

    return false;
  }

  if (typeof permissionsModule.permissions !== 'function') {
    console.error(strip`
      | ${chalk.bgRed('Error')} ${permissionsFile} does not export
        ~ "permissions" function.
      |
      |`);

    return false;
  }

  let permissions = { };
  try {
    permissions = permissionsModule.permissions();
  } catch (e) {
    console.error(strip`
      | ${chalk.bgRed('Error')} Permissions function in ${permissionsFile}
        ~ threw an expection.
      |
      | Error message: ${e.message}
      |
      |`);
    return false;
  }
  if (typeof permissions !== 'object' || Array.isArray(permissions)) {
    console.error(strip`
      | ${chalk.bgRed('Error')} Permissions function in ${permissionsFile}
        ~ should return an object.
      |
      |`);
    return false;
  }
  progress.tick(1);

  const missingPermissions = values(schema)
    .filter(type =>
      type.kind === 'type' && type.implementsNode ||
      type.kind === 'mutation')
    .reduce( (acc, type) => {
      if (typeof permissions[type.name] !== 'function') {
        progress.tick(1);
        return acc.concat({
          name: type.name,
          kind: type.kind,
        });
      }

      progress.tick(1);
      return acc;
    }, [ ]);

  if (missingPermissions.length) {
    console.log(strip`
      | ${chalk.bgYellow('Warning')} Permissions function in ${permissionsFile}
        ~ is missing permissions for:
      |
      |${missingPermissions
          .map((p, i) => `   ${i + 1}. ${p.name} ${p.kind}`)
          .join('\n')}
      |
      | When permissions are not explicitly defined, the server will disallow
        ~ access.
      |`);
  }

  return true;
}
