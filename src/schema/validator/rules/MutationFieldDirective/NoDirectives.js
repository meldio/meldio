/* @flow */

import { error } from '../../utils.js';
import type { Rule } from '../../types';

export const NoDirectives: Rule = ({ directive, field, mutation }) => {
  if (!mutation || !field || !directive) {
    throw Error('context not passed to rule.');
  }

  return error`Field "${field.name}" of mutation "${mutation.name}" cannot have
             ~ a "@${directive.name}" directive, that is currently
             ~ unsupported. ${directive.loc}`;
};
