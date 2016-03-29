/* @flow */

import { sentenceCase } from '../../../../jsutils/casing';
import { warning } from '../../utils';
import type { Rule } from '../../types';

export const NameInSentenceCase: Rule = ({ interface: inter }) => {
  if (!inter) { throw Error('context not passed to rule.'); }
  const { name, loc } = inter;

  if (name !== sentenceCase(name)) {
    return warning`Interface name "${name}" should be in "SentenceCase".${loc}`;
  }
};
