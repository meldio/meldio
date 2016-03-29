/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const NodeConnectionEdgeTypeIsConsistent: Rule =
({ type: t, field, schema }) => {
  if (!t || !field) { throw Error('context not passed to rule.'); }
  const { name: tName } = t;
  const { name, loc, isNodeConnection, type, relatedField, edgeType } = field;

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
          rf.isNodeConnection && rf.edgeType === edgeType)) {
      return error`Field "${name}" on "${tName}" type defines a
          ~ NodeConnection to "${type}" and "${relatedField}" field with
          ~ "${edgeType}" edge. However, some of the back references define a
          ~ different edge type. Edge types must be consistent. ${loc}`;
    }
  }
};
