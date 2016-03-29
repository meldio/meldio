/* @flow */

import { capitalCase } from '../../../../jsutils/casing';
import { warning } from '../../utils';
import type { Rule } from '../../types';

export const ValueInCapitalCase: Rule = ({ enum: enumeration }) => {
  if (!enumeration) { throw Error('context not passed to rule.'); }
  const { name, values, loc } = enumeration;

  return values
    .filter(value => value !== capitalCase(value))
    .map(value =>
      warning`Enum value "${value}" defined in enum "${name}" should be in
            ~ "CAPITAL_CASE". ${loc}`);
};
