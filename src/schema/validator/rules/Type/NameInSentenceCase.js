/* @flow */

import { sentenceCase } from '../../../../jsutils/casing';
import { warning } from '../../utils';
import type { Rule } from '../../types';

export const NameInSentenceCase: Rule = ({ type }) => {
  if (!type) { throw Error('context not passed to rule.'); }
  const { name, loc } = type;

  if (name !== sentenceCase(name)) {
    return warning`Type name "${name}" should be in "SentenceCase".${loc}`;
  }
};
