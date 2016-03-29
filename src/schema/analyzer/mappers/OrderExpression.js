/* @flow */

import type { AnalyzerContext, OrderExpressionMapper } from '../types';

export function OrderExpression(
  context: AnalyzerContext
): OrderExpressionMapper {

  return expression => ({
    kind: 'order-expression',
    ...!context.noLocation && expression.loc ? {
      loc: {
        kind: 'location',
        start: expression.loc.start,
        end: expression.loc.end } } : {},
    key: expression.key.name.value,
    expressionASTs: expression.expression,
  });
}
