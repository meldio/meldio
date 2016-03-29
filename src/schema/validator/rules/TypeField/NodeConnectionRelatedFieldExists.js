/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const NodeConnectionRelatedFieldExists: Rule =
({ type: t, field, schema }) => {
  if (!t || !field) { throw Error('context not passed to rule.'); }
  const { name: tName } = t;
  const { name, loc, isNodeConnection, type, relatedField } = field;

  const related = schema[type];

  if (isNodeConnection && relatedField && related) {
    const relatedFieldExists =
      related.kind === 'interface' || related.kind === 'type' ?
        related.fields.some(f => f.name === relatedField) :
      related.kind === 'union' ?
        related.typeNames.every(typeName =>
          schema[typeName] && schema[typeName].kind === 'type' &&
          schema[typeName].fields.some(f => f.name === relatedField)) :
        false;

    if (!relatedFieldExists) {
      return error`Field "${name}" on "${tName}" type defines a
                 ~ NodeConnection to "${type}" and "${relatedField}" field.
                 ~ However, "${relatedField}" field is not defined on
                 ~ "${type}". ${loc}`;
    }
  }
};
