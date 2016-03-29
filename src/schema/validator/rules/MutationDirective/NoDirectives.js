/* @flow */

import { error } from '../../utils.js';
import type { Rule } from '../../types';

export const NoDirectives: Rule = ({ mutation, directive }) => {
  if (!mutation || !directive) { throw Error('context not passed to rule.'); }
  const { name: mutationName } = mutation;
  const { name, loc } = directive;

  return error`Mutation "${mutationName}" cannot have a "@${name}" directive,
             ~ that is currently unsupported. ${loc}`;
};
