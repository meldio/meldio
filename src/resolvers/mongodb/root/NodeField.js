import { typeFromGlobalId } from '../../../jsutils/globalId';
import { permissionFilter } from '../common';
import values from '../../../jsutils/values';
import {
  MAJORITY_READ_OPTIONS,
  LOCAL_READ_OPTIONS,
} from '../common';

export function NodeField({ schema }) {
  const nodeTypes = new Set(
    values(schema)
      .filter(type => type.kind === 'type' && type.implementsNode)
      .map(node => node.name));

  return async function(parent, args, info) {
    const { rootValue } = info;
    const { db, config } = rootValue;

    const readOptions = config.committedReads ?
      MAJORITY_READ_OPTIONS :
      LOCAL_READ_OPTIONS;

    if (!args.id) {
      return null;
    }

    const typeName = typeFromGlobalId(args.id);
    if (!nodeTypes.has(typeName)) {
      return null;
    }

    const filter = await permissionFilter(schema, rootValue, typeName);
    if (!filter) {
      return null;
    }

    const data = await db
      .collection(typeName, readOptions)
      .findOne({
        $and: [
          ...filter,
          { _id: args.id },
        ]});
    return data || null;
  };
}
