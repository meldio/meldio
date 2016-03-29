/* @flow */

import { error } from '../../utils.js';
import type { Rule } from '../../types';

export const OneTypeMustImplementNode: Rule = ({ schema }) => {
  const aTypeImplementsNode =
    Object.keys(schema)
      .map(key => schema[key])
      .some(def => def.kind === 'type' && def.implementsNode);

  if (!aTypeImplementsNode) {
    return error`At least one type must implement Node interface.`;
  }
};
