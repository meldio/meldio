/* @flow */

import type { TransformerAccumulator } from '../types';
import type { TypeDefinition } from '../../language/ast';

import { sentenceCase } from '../../../jsutils/casing';
import {
  makeType,
  makeField,
  makeRequiredInput,
} from '../../ast';

export function MakeRootMutationsType(
  accumulator: TransformerAccumulator,
): Array<TypeDefinition> {
  const fields = accumulator.mutations
    .map(mutation =>
      makeField(
        mutation.name,
        [ makeRequiredInput('input', `${sentenceCase(mutation.name)}Input`) ],
        `${sentenceCase(mutation.name)}Payload`) );
  const interfaces = [ ];

  return fields.length ?
    [ makeType('_Mutations', interfaces, fields) ] :
    [ ];
}
