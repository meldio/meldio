/* @flow */

import { error } from '../../utils.js';
import type { Rule } from '../../types';

export const NoDirectives: Rule = ({ union, directive }) => {
  if (!union || !directive) { throw Error('context not passed to rule.'); }
  const { name: unionName } = union;
  const { name, loc } = directive;

  return error`Union "${unionName}" cannot have a "@${name}" directive,
             ~ that is currently unsupported. ${loc}`;
};
