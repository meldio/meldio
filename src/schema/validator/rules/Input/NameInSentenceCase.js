/* @flow */

import { sentenceCase } from '../../../../jsutils/casing';
import { warning } from '../../utils';
import type { Rule } from '../../types';

export const NameInSentenceCase: Rule = ({ input }) => {
  if (!input) { throw Error('context not passed to rule.'); }
  const { name, loc } = input;

  if (name !== sentenceCase(name)) {
    return warning`Input object name "${name}" should be in
                 ~ "SentenceCase". ${loc}`;
  }
};
