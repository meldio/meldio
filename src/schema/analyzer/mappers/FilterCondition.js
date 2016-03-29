/* @flow */

import { Argument } from './Argument';
import type { AnalyzerContext, FilterConditionMapper } from '../types';

export function FilterCondition(
  context: AnalyzerContext
): FilterConditionMapper {

  return condition => ({
    kind: 'filter-condition',
    ...!context.noLocation && condition.loc ? {
      loc: {
        kind: 'location',
        start: condition.loc.start,
        end: condition.loc.end } } : {},
    key: condition.key.name.value,
    arguments: condition.arguments.map(Argument(context)),
    conditionAST: condition.condition,
  });
}
