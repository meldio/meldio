import { AddArgsToListsAndConnections} from './AddArgsToListsAndConnections';
import { RemoveAllDirectives } from './RemoveAllDirectives';
import { RemoveOrderDefs } from './RemoveOrderDefs';
import { RemoveMutationDefs } from './RemoveMutationDefs';
import { RemoveFilterDefs } from './RemoveFilterDefs';
import { ReplaceEdgeDefs } from './ReplaceEdgeDefs';
import { ReplaceNodeConnectionDefs } from './ReplaceNodeConnectionDefs';
import { ReplaceObjectConnectionDefs } from './ReplaceObjectConnectionDefs';
import { ReplaceScalarConnectionDefs } from './ReplaceScalarConnectionDefs';

export function makeVisitors(accumulator, context) {
  const passes = [ ];
  // first pass:
  passes.push({
    ...RemoveFilterDefs(accumulator, context),
    ...RemoveOrderDefs(accumulator, context),
  });
  passes.push({
    ...AddArgsToListsAndConnections(accumulator, context),
    ...RemoveAllDirectives(accumulator, context),
    ...RemoveMutationDefs(accumulator, context),
    ...ReplaceEdgeDefs(accumulator, context),
    ...ReplaceNodeConnectionDefs(accumulator, context),
    ...ReplaceObjectConnectionDefs(accumulator, context),
    ...ReplaceScalarConnectionDefs(accumulator, context)
  });
  return passes;
}
