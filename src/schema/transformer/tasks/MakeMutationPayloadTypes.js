/* @flow */

import type { TransformerAccumulator } from '../types';
import type { TypeDefinition } from '../../language/ast';
import { sentenceCase } from '../../../jsutils/casing';
import { makeRequiredField, makeType } from '../../ast';

export function MakeMutationPayloadTypes(
  accumulator: TransformerAccumulator,
): Array<TypeDefinition> {
  return accumulator.mutations.map(mutation => {
    const payloadTypeName = `${sentenceCase(mutation.name)}Payload`;
    const hasClientMutationId = mutation.fieldASTs
      .filter(field => field.name.value === 'clientMutationId')
      .length > 0;
    const interfaces = [ ];
    const fields = [
      ...mutation.fieldASTs,
      ...!hasClientMutationId ?
        [ makeRequiredField('clientMutationId', [ ], 'String') ] :
        [ ]
    ];
    return makeType(payloadTypeName, interfaces, fields);
  });
}
