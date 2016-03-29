/* @flow */

import { error } from '../../utils.js';
import type { Rule } from '../../types';

export const NoDirectives: Rule = ({ interface: inter, directive }) => {
  if (!inter || !directive) { throw Error('context not passed to rule.'); }
  const { name: interfaceName } = inter;
  const { name, loc } = directive;

  return error`Interface "${interfaceName}" cannot have a "@${name}" directive,
             ~ that is currently unsupported. ${loc}`;
};
