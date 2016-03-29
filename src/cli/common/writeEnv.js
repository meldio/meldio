import isNullish from '../../jsutils/isNullish';
import { writeFile } from './writeFile';

export async function writeEnv(path, content) {
  const text = Object.keys(content)
    .filter( key => !isNullish(content[key]) )
    .map( key => `${key}=${content[key]}`)
    .join('\n');
  return writeFile(path, text);
}
