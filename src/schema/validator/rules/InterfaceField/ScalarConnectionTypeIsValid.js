/* @flow */

import { SCALAR_TYPES } from '../../../analyzer';
import { error } from '../../utils';
import type { Rule } from '../../types';

export const ScalarConnectionTypeIsValid: Rule =
({ interface: inter, field, schema }) => {
  if (!inter || !field) { throw Error('context not passed to rule.'); }
  const { name: interfaceName } = inter;
  const { name, loc, isScalarConnection, type } = field;

  const related = schema[type];

  if (isScalarConnection &&
      !SCALAR_TYPES.includes(type) &&
      (!related || related.kind !== 'enum')) {
    return error`Field "${name}" on "${interfaceName}" interface defines a
               ~ ScalarConnection with an invalid type.  Type can be a scalar
               ~ or an enum. ${loc}`;
  }
};
