/* @flow */

import { sentenceCase } from '../../../../jsutils/casing';
import { warning } from '../../utils';
import type { Rule } from '../../types';

export const NameInSentenceCase: Rule = ({ union }) => {
  if (!union) { throw Error('context not passed to rule.'); }
  const { name, loc } = union;

  if (name !== sentenceCase(name)) {
    return warning`Union name "${name}" should be in "SentenceCase".${loc}`;
  }
};
