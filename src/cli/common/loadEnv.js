
import { readFile } from './readFile';

export async function loadEnv(filePath) {

  let envText;
  try {
    envText = await readFile(filePath);
  } catch (e) {
    // if file is not found, simply return an empty env object:
    if (e.code === 'ENOENT') {
      return { };
    }
    throw e;
  }

  return envText.split('\n')
    .map( line => splitOnEq(line) )
    .filter( ([ variable, value ]) => variable && value )
    .map( ([ variable, value ]) => ({ [variable]: value }) )
    .reduce( (acc, val) => ({...acc, ...val}), { } );
}

const splitOnEq = str => {
  const pos = str.indexOf('=');
  const hasEq = pos !== -1;

  const name = hasEq ? str.substring(0, pos) : str;
  const value = hasEq ? str.substring(pos + 1) : '';

  return [ name, value ];
};
