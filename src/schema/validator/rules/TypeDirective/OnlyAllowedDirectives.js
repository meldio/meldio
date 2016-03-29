/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const OnlyAllowedDirectives: Rule = ({ type, directive }) => {
  if (!type || !directive) { throw Error('context not passed to rule.'); }
  const { name: typeName } = type;
  const { name, loc } = directive;

  if (name !== 'rootConnection' && name !== 'rootViewer') {
    return error`Type "${typeName}" cannot have "@${name}" directive,
               ~ that is currently unsupported. ${loc}`;
  }
};
