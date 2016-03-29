/* @flow */

import { camelCase } from '../../../../jsutils/casing';
import { warning } from '../../utils';
import type { Rule } from '../../types';

export const NameInCamelCase: Rule = ({ input, argument }) => {
  if (!input || !argument) { throw Error('context not passed to rule.'); }
  const { name: inputName } = input;
  const { name, loc } = argument;

  if (name !== camelCase(name)) {
    return warning`Field "${name}" of input object "${inputName}" should be
                 ~ in "camelCase". ${loc}`;
  }
};
