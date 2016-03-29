import isNullish from '../../../jsutils/isNullish';
import type { ConnectionArguments } from '../../common/types';
import { getOffsetWithDefault } from '../../common/utils/connection';

type MongoPagingExpression = { $limit: number } | { $skip: number };
type PageBuilderResult = {
  skipOffset: number,
  stages: Array<MongoPagingExpression>,
};

export function pagingBuilder(
  args: ConnectionArguments,
  length: number
): PageBuilderResult {
  const { after, before, first, last } = args;

  if (!isNullish(first)) {
    const skipOffset = getOffsetWithDefault(after, length, -1) + 1;
    return {
      skipOffset,
      stages: [
        { $skip: skipOffset },
        { $limit: first }
      ]
    };
  } else if (!isNullish(last)) {
    const beforeOffset = getOffsetWithDefault(before, length, length);
    const skipOffset = Math.max(0, beforeOffset - last);
    const limit = beforeOffset - skipOffset;
    return {
      skipOffset,
      stages: [
        { $skip: skipOffset },
        { $limit: limit }
      ]
    };
  }
  return {
    skipOffset: 0,
    stages: [ ]
  };
}
