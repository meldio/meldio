/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const NodeConnectionEdgeTypeIsConsistent: Rule =
({ interface: inter, field, schema }) => {
  if (!inter || !field) { throw Error('context not passed to rule.'); }
  const { name: interfaceName } = inter;
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
      return error`Field "${name}" on "${interfaceName}" interface defines a
          ~ NodeConnection to "${type}" and "${relatedField}" field with
          ~ "${edgeType}" edge. However, some of the back references define a
          ~ different edge type. Edge types must be consistent. ${loc}`;
    }
  }
};
