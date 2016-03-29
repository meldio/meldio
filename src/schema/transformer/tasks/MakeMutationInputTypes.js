/* @flow */

import type { TransformerAccumulator } from '../types';
import type { TypeDefinition } from '../../language/ast';

import { sentenceCase } from '../../../jsutils/casing';
import { makeRequiredInput, makeInputObject } from '../../ast';

export function MakeMutationInputTypes(
  accumulator: TransformerAccumulator,
): Array<TypeDefinition> {
  return accumulator.mutations.map(mutation => {
    const inputObjectName = `${sentenceCase(mutation.name)}Input`;
    const hasClientMutationId = mutation.argumentASTs
      .filter(arg => arg.name.value === 'clientMutationId')
      .length > 0;
    const fields = [
      ...mutation.argumentASTs,
      ...!hasClientMutationId ?
        [ makeRequiredInput('clientMutationId', 'String') ] :
        [ ]
    ];
    return makeInputObject(inputObjectName, fields);
  });
}
