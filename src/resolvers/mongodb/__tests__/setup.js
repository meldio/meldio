import invariant from '../../../jsutils/invariant';
import { graphql } from 'graphql';
import * as resolvers from '..';

import {
  parse,
  analyzeAST,
  validate,
  transformAST,
  generate,
  // print,
} from '../../../schema';

export async function GraphQL(definition, db, mutations, config, permissions) {
  const ast = parse(definition);
  const schema = analyzeAST(ast);
  const results = validate(schema);
  invariant(results.length === 0, 'Schema validation results:\n' +
    results.map(r => r.description).join('\n'));
  const transformedAST = transformAST(ast, schema);
  const result = generate(transformedAST, schema, resolvers);

  // console.log(print(transformedAST));

  const rootValue = {
    db,
    mutations: mutations || { },
    config: config || { enabledAuth: [ ] },
    permissions: permissions || { },
  };

  return async function (requestString, viewerId) {
    return viewerId ?
      graphql(result, requestString, { ...rootValue, viewerId } ) :
      graphql(result, requestString, rootValue);
  };
}
