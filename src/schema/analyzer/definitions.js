/* @flow */

export const NUMERIC_TYPES: Array<string> = [ 'Int', 'Float' ];
export const SCALAR_TYPES: Array<string> =
  NUMERIC_TYPES.concat([ 'Boolean', 'String', 'ID' ]);
