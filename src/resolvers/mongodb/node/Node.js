import invariant from '../../../jsutils/invariant';
import { typeFromGlobalId } from '../../../jsutils/globalId';
import { permissionFilter } from '../common';
import {
  MAJORITY_READ_OPTIONS,
  LOCAL_READ_OPTIONS,
} from '../common';

export function Node({ schema, field }) {
  invariant(field, 'field must be passed to resolver');

  return async function (parent, args, info) {
    const { rootValue } = info;
    const { db, config } = rootValue;

    const readOptions = config.committedReads ?
      MAJORITY_READ_OPTIONS :
      LOCAL_READ_OPTIONS;

    if (!parent[field]) {
      return null;
    }

    const id = parent[field];
    const type = typeFromGlobalId(id);
    if (!type) {
      return null;
    }

    const filter = await permissionFilter(schema, rootValue, type);
    if (!filter) {
      return null;
    }

    const result = await db
      .collection(type, readOptions)
      .findOne({
        $and: [
          ...filter,
          { _id: id },
        ]
      });

    return result;
  };
}
