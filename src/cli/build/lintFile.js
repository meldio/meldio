import { linter } from 'eslint';
import { readFile } from '../common';

export async function lintFile(fileName, lintConfig) {
  const code = await readFile(fileName);

  return {
    lintResults:
      linter.verify(code, lintConfig, fileName),
    code
  };
}
