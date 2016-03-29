/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const NodeConnectionPointsBack: Rule =
({ interface: inter, field, schema }) => {
  if (!inter || !field) { throw Error('context not passed to rule.'); }
  const { name: interfaceName } = inter;
  const { name, loc, isNodeConnection, type, relatedField } = field;

  const related = schema[type];

  if (isNodeConnection && relatedField && related) {
    const relatedFields =
      related.kind === 'interface' || related.kind === 'type' ?
        related.fields.filter(f => f.name === relatedField) :
      related.kind === 'union' ?
        related.typeNames
          .map(typeName =>
            schema[typeName] && schema[typeName].kind === 'type' ?
              schema[typeName].fields.filter(f => f.name === relatedField) :
              [ ])
          .reduce((acc, fields) => acc.concat(fields), [ ]) :
        [ ];

    if (relatedFields.length &&
        !relatedFields.every(rf =>
          rf.isNodeConnection &&
          rf.relatedField === name &&
          rf.type === interfaceName)) {
      return error`Field "${name}" on "${interfaceName}" interface defines a
                 ~ NodeConnection to "${type}" and "${relatedField}" field.
                 ~ However, some of the back references are not pointing back to
                 ~ "${interfaceName}" and "${name}". ${loc}`;
    }
  }
};
