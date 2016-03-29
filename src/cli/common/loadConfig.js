
import { resolve as resolvePath } from 'path';
import { readFile } from './readFile';

export async function loadConfig() {
  const packagePath = resolvePath('package.json');
  const packageText = await readFile(packagePath);
  const packageObj = JSON.parse(packageText) || { };
  return {
    name: packageObj.name,
    version: packageObj.version,
    ...packageObj.config && packageObj.config.meldio ?
      packageObj.config.meldio :
      { }
  };
}
