/* @flow */

import { warning } from '../../utils.js';
import type { Rule } from '../../types';

export const ArgumentIsNotRequired: Rule = ({ filter, argument }) => {
  if (!filter || !argument) { throw Error('context not passed to rule.'); }
  const { name: filterName } = filter;
  const target = filterName.replace('Filter#', '');
  const { name, loc, isRequired } = argument;

  if (isRequired) {
    return warning`Filter on ${target} defines an argument "${name}" as
                 ~ required, which probably should not be the case.
                 ~ Typically, arguments are only applicable to some of the
                 ~ filter keys and should not be passed when other filter keys
                 ~ are specified. ${loc}`;
  }
};
