/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const NoArguments: Rule = ({ interface: inter, field }) => {
  if (!inter || !field) { throw Error('context not passed to rule.'); }
  const { name: interfaceName } = inter;
  const { name, loc, hasArguments } = field;

  if (hasArguments) {
    return error`Field "${name}" of interface "${interfaceName}" cannot have
               ~ arguments, that is currently unsupported. ${loc}`;
  }
};
