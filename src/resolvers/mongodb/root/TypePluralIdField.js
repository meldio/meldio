import { typeFromGlobalId } from '../../../jsutils/globalId';
import invariant from '../../../jsutils/invariant';
import { permissionFilter } from '../common';
import {
  MAJORITY_READ_OPTIONS,
  LOCAL_READ_OPTIONS,
} from '../common';

export function TypePluralIdField({ schema, name, field }) {
  const type = schema[name];
  invariant(type && type.kind === 'type', 'type must be passed to resolver');
  invariant(field, 'field must be passed to resolver');

  return async function (parent, args, info) {
    const { rootValue } = info;
    const { db, config } = rootValue;

    const readOptions = config.committedReads ?
      MAJORITY_READ_OPTIONS :
      LOCAL_READ_OPTIONS;

    if (!args[field] || !args[field].length) {
      return [ ];
    }

    const ids =
      field === 'id' ?
        [].concat(args[field])
          .filter(id => typeFromGlobalId(id) === type.name) :
        [].concat(args[field]);

    const filter = await permissionFilter(schema, rootValue, type.name);
    if (!filter) {
      return [ ];
    }

    const query = { $and: [
      ...filter,
      {
        [field === 'id' ? '_id' : field]:
          ids.length === 1 ? ids[0] : { $in: ids }
      }
    ]};

    const results = await db
      .collection(type.name, readOptions)
      .find(query)
      .toArray();

    // Relay requires each plural identifying root field to return results in
    // the same order as specified in the argument list and null if not found:
    const resultsMap =
      results.reduce(
        (acc, result) => ({
          ...acc,
          [result[field === 'id' ? '_id' : field]]:
            result }),
        { });

    return args[field].map(val => resultsMap[val] || null);
  };
}
