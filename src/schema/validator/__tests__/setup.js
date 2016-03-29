import { parse as parseSchemaIntoAST } from '../../language';
import { analyzeAST } from '../../analyzer';
import { validate } from '../validate';

export {
  TYPE_RESERVED_WORDS,
  TYPE_RESERVED_SUFFIXES,
  FIELD_RESERVED_WORDS,
  ARGUMENT_RESERVED_WORDS,
} from '../definitions';

export const runTest = str => validate(analyzeAST(parseSchemaIntoAST(str)));

export const separateResults = results => ({
  warnings: results.filter(r => r.kind === 'warning').map(r => r.description),
  errors: results.filter(r => r.kind === 'error').map(r => r.description)
});

export const tokenTypeDef = `
    type TokenTypeDef implements Node {
      id: ID!
    } `;
export const inputOkListTypes = [
  '[Int]', '[Int!]', '[Int]!', '[Int!]!',
  '[Float]', '[Float!]', '[Float]!', '[Float!]!',
  '[Boolean]', '[Boolean!]', '[Boolean]!', '[Boolean!]!',
  '[String]', '[String!]', '[String]!', '[String!]!',
  '[ID]', '[ID!]', '[ID]!', '[ID!]!',
  '[Enum]', '[Enum!]', '[Enum]!', '[Enum!]!',
  '[Object]', '[Object!]', '[Object]!', '[Object!]!' ];

export const inputOkFieldTypes = [
  'Int', 'Int!', 'Float', 'Float!', 'Boolean', 'Boolean!', 'String', 'String!',
  'ID', 'ID!', 'Enum', 'Enum!', 'Object', 'Object!',
  '[Int]', '[Int!]', '[Int]!', '[Int!]!',
  '[Float]', '[Float!]', '[Float]!', '[Float!]!',
  '[Boolean]', '[Boolean!]', '[Boolean]!', '[Boolean!]!',
  '[String]', '[String!]', '[String]!', '[String!]!',
  '[ID]', '[ID!]', '[ID]!', '[ID!]!',
  '[Enum]', '[Enum!]', '[Enum]!', '[Enum!]!',
  '[Object]', '[Object!]', '[Object]!', '[Object!]!' ];

export const inputBadFieldTypes = [
  'Object', 'Object!', 'Interface', 'Interface!', 'Union', 'Union!',
  '[Object]', '[Object!]', '[Object]!', '[Object!]!',
  '[Interface]', '[Interface!]', '[Interface]!', '[Interface!]!',
  '[Union]', '[Union!]', '[Union]!', '[Union!]!' ];

export const okListTypes = inputOkListTypes.concat([
  '[Inteface]', '[Inteface!]', '[Inteface]!', '[Inteface!]!',
  '[Union]', '[Union!]', '[Union]!', '[Union!]!' ]);

export const badListTypes = [
  '[[String!]]', '[[String]]', '[[String]!]', '[[String!]!]', '[[String!]!]!',
  '[[Int]!]!', '[[[[[[Int]]]]]]', '[[[[[[Object]!]!]!]!]!]!' ];

export const unionedTypes = ` type Foo { id: ID! } type Bar { id: ID! } `;

export const typesSetup = `
  type A implements Node { id: ID! foo: String }
  type B implements Node { id: ID! bar: String }
  type C implements Node { id: ID! baz: String }
  type D implements Node { id: ID! zaz: String }

  type W { foo: String }
  type X { bar: String }
  type Y { baz: String }
  type Z { zaz: String }
`;
