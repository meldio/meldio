import { parse, print } from '../../language';
import { analyzeAST } from '../../analyzer';
import { transformAST } from '../transformAST';
// import { buildSchema } from '../../buildSchema';
import { validate } from '../../validator';
import strip from '../../../jsutils/strip';

export const stripMargin = strip;

export function runTest(str: string) {
  const ast = parse(str);
  const metadata = analyzeAST(ast);
  validate(metadata);
  const transformedAST = transformAST(ast, metadata);
  // try to build just to see if it throws -
  // buildSchema(richAST, !!Object.keys(schemaDescription.mutations).length);
  return print(transformedAST);
}
