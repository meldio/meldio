/* @flow */

import type { TransformerAccumulator, TransformerContext} from '../types';
import type { TypeDefinition } from '../../language/ast';

import { MakeBasicEnums } from './MakeBasicEnums';
import { MakeConnectionTypes } from './MakeConnectionTypes';
import { MakeFilterInputTypes } from './MakeFilterInputTypes';
import { MakeMutationInputTypes } from './MakeMutationInputTypes';
import { MakeMutationPayloadTypes } from './MakeMutationPayloadTypes';
import { MakeNamedFilterEnums } from './MakeNamedFilterEnums';
import { MakeNamedOrderEnums } from './MakeNamedOrderEnums';
import { MakeNodeInterface } from './MakeNodeInterface';
import { MakeNumericFieldEnums } from './MakeNumericFieldEnums';
import { MakeOrderInputTypes } from './MakeOrderInputTypes';
import { MakePageInfoType } from './MakePageInfoType';
import { MakeRootMutationsType } from './MakeRootMutationsType';
import { MakeRootQueryType } from './MakeRootQueryType';

type Task =
  (accumulator: TransformerAccumulator, context: TransformerContext) =>
    Array<TypeDefinition>;

const tasks: Array<Task> = [
  MakeBasicEnums,
  MakeConnectionTypes,
  MakeFilterInputTypes,
  MakeMutationInputTypes,
  MakeMutationPayloadTypes,
  MakeNamedFilterEnums,
  MakeNamedOrderEnums,
  MakeNodeInterface,
  MakeNumericFieldEnums,
  MakeOrderInputTypes,
  MakePageInfoType,
  MakeRootMutationsType,
  MakeRootQueryType,
];

export { makeVisitors } from './visitor';

export function makeDefinitions(
  accumulator: TransformerAccumulator,
  context: TransformerContext
): Array<TypeDefinition> {
  return tasks
    .map( task => task(accumulator, context) )
    .reduce( (acc, list) => acc.concat(list), [ ] );
}
