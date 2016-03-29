/* @flow */

import { SCALAR_TYPES } from '../../../analyzer';
import { error } from '../../utils';
import type { Rule } from '../../types';

export const TypeMustBeDefined: Rule = ({ filter, schema }) => {
  if (!filter) { throw Error('context not passed to rule.'); }
  const { name, loc, type } = filter;
  const target = name.replace('Filter#', '');

  const isDefined =
    SCALAR_TYPES.includes(type) ||
    schema[type] &&
    [ 'enum', 'interface', 'union', 'type' ].includes(schema[type].kind);

  if (!isDefined) {
    return error`Filter on ${target} references "${type}", but no
               ~ such type is defined. Filter must reference a valid type.
               ~ ${loc}`;
  }
};
