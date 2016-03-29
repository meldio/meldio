/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const NodeConnectionRelatedFieldExists: Rule =
({ interface: inter, field, schema }) => {
  if (!inter || !field) { throw Error('context not passed to rule.'); }
  const { name: interfaceName } = inter;
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
      return error`Field "${name}" on "${interfaceName}" interface defines a
                 ~ NodeConnection to "${type}" and "${relatedField}" field.
                 ~ However, "${relatedField}" field is not defined on
                 ~ "${type}". ${loc}`;
    }
  }
};
