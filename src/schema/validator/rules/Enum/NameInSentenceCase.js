/* @flow */

import { sentenceCase } from '../../../../jsutils/casing';
import { warning } from '../../utils';
import type { Rule } from '../../types';

export const NameInSentenceCase: Rule = ({ enum: enumeration }) => {
  if (!enumeration) { throw Error('context not passed to rule.'); }
  const { name, loc } = enumeration;

  if (name !== sentenceCase(name)) {
    return warning`Enum name "${name}" should be in "SentenceCase". ${loc}`;
  }
};
