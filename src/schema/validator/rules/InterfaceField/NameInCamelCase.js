/* @flow */

import { camelCase } from '../../../../jsutils/casing';
import { warning } from '../../utils';
import type { Rule } from '../../types';

export const NameInCamelCase: Rule = ({ interface: inter, field }) => {
  if (!inter || !field) { throw Error('context not passed to rule.'); }
  const { name: interfaceName } = inter;
  const { name, loc } = field;

  if (name !== camelCase(name)) {
    return warning`Field "${name}" of interface "${interfaceName}" should be in
                 ~ "camelCase". ${loc}`;
  }
};
