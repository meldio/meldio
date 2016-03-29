/* @flow */

import { error } from '../../utils.js';
import type { Rule } from '../../types';

export const OneTypeMayHaveRootViewer: Rule = ({ schema }) => {
  const typesWithRootViewer =
    Object.keys(schema)
      .map(key => schema[key])
      .filter(def => def.kind === 'type' &&
                     def.directives.some(d => d.name === 'rootViewer'));

  if (typesWithRootViewer.length > 1) {
    return error`At most one type can have @rootViewer directive.`;
  }
};
