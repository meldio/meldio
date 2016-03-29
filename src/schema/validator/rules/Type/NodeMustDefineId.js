/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const NodeMustDefineId: Rule = ({ type }) => {
  if (!type) { throw Error('context not passed to rule.'); }
  const { name, loc, implementsNode, fields } = type;

  const idField = fields.filter(field => field.name === 'id');
  if (implementsNode &&
        (!idField.length ||
          idField[0].type !== 'ID' ||
         !idField[0].isRequired) ) {
    return error`Type "${name}" must include id field of type ID!. ${loc}`;
  }
};
