/* @flow */

export const TYPE_RESERVED_WORDS: Array<string> = [
  // 'Node',                   // relay type, but analyzer will catch this
  'PageInfo',                  // relay type
  'Long',                      // 64 bit int scalar (future)
  'Polygon', 'Point',          // geo location type (future)
  'Date' ];                    // date / time type (future)

export const FIELD_RESERVED_WORDS: Array<string> = [
  '_id',     // MongoDB
  '_type',   // db storage (for non-Node objects)
  'node',    // Relay
  'cursor',  // Relay
  'type',    // filter expressions
  'exists',  // filter expressions
  'and',     // filter expressions (future)
  'or',      // filter expressions (future)
  'not',     // filter expressions (future)
  'clear',   // update expressions
  'update',  // Mutations API (NodeObject)
  'delete' ]; // Mutations API (NodeObject)

export const TYPE_RESERVED_SUFFIXES: Array<string> =
  [ 'Connection', 'Edge', 'Payload', 'Input' ];

export const AGGREGATION_FIELD_NAMES: Array<string> =
  [ 'count', 'sum', 'min', 'max', 'average' ];

export const ARGUMENT_RESERVED_WORDS: Array<string> = [
  'first', 'last', 'after', 'before', 'filter', 'order', 'filterBy', 'orderBy'
];
