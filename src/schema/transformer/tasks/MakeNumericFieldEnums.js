/* @flow */

import type { TransformerAccumulator, TransformerContext} from '../types';
import type { TypeDefinition } from '../../language/ast';

import { makeEnum } from '../../ast';

export function MakeNumericFieldEnums(
  accumulator: TransformerAccumulator,
  context: TransformerContext
): Array<TypeDefinition> {
  const { schema, connections } = context;
  const numericEnums = { };

  connections
    .filter(connection =>
      schema[connection.type] &&
      schema[connection.type].fields &&
      schema[connection.type].fields.some(f => f.isNumeric))
    .forEach(connection => {
      // flowism:
      if (!schema[connection.type].fields) { return; }

      if (!numericEnums[connection.type]) {
        numericEnums[connection.type] =
          makeEnum(`_${connection.type}_NumericFields`,
            schema[connection.type].fields
              .filter(f => f.isNumeric)
              .map(f => f.name));
      }
    });

  connections
    .filter(connection =>
      schema[connection.edgeType] &&
      schema[connection.edgeType].fields &&
      schema[connection.edgeType].fields.some(f => f.isNumeric))
    .forEach(connection => {
      // flowism:
      if (!schema[connection.edgeType].fields) { return; }

      if (!numericEnums[connection.edgeType]) {
        numericEnums[connection.edgeType] =
          makeEnum(`_${connection.edgeType}_NumericFields`,
            schema[connection.edgeType].fields
              .filter(f => f.isNumeric)
              .map(f => f.name));
      }
    });

  return Object.keys(numericEnums).map(key => numericEnums[key]);
}
