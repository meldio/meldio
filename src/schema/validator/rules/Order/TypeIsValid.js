/* @flow */

import { error } from '../../utils';
import type { Rule } from '../../types';

export const TypeIsValid: Rule = ({ order, schema }) => {
  if (!order) { throw Error('context not passed to rule.'); }

  function hasScalarFields(typeName: ?string): bool {
    return typeName ?
      schema[typeName] &&
      (
        schema[typeName].kind === 'type' ||
        schema[typeName].kind === 'interface'
      ) &&
      schema[typeName].fields.some(f => f.isScalar) :
      false;
  }

  const {
    loc,
    name,
    type: typeName,
    edgeType: edgeTypeName,
    isObjectList,
    isNodeList,
    isScalarConnection,
    isObjectConnection,
    isNodeConnection,
  } = order;
  const target = name.replace('Order#', '');

  const isOrderSupported =
    isNodeList || isObjectList && hasScalarFields(typeName) ||
    isScalarConnection || isNodeConnection ||
    isObjectConnection &&
      (hasScalarFields(typeName) || hasScalarFields(edgeTypeName));

  if (!isOrderSupported) {
    return error`Order cannot be defined on ${target}. Order can only be defined
               ~ on non-scalar lists and connections with scalar fields on nodes
               ~ or edges. ${loc}`;
  }
};
