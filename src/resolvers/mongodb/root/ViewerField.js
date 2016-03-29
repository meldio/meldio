import { typeFromGlobalId } from '../../../jsutils/globalId';
import {
  MAJORITY_READ_OPTIONS,
  LOCAL_READ_OPTIONS,
} from '../common';

export function ViewerField({ typeName }) {
  return async function(parent, args, info) {
    const { rootValue } = info;
    const { db, config, viewerId } = rootValue;

    const readOptions = config.committedReads ?
      MAJORITY_READ_OPTIONS :
      LOCAL_READ_OPTIONS;

    if (!viewerId) {
      return null;
    }

    if (typeName !== typeFromGlobalId(viewerId)) {
      throw new Error('Type of viewerId does not match declared viewer type.');
    }

    const data = await db
      .collection(typeName, readOptions)
      .findOne({ _id: viewerId });

    return data || null;
  };
}
