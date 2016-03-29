import { typeFromGlobalId } from '../../../jsutils/globalId';
import invariant from '../../../jsutils/invariant';
import flatten from '../../../jsutils/flatten2';
import { permissionFilter } from '../common';
import {
  MAJORITY_READ_OPTIONS,
  LOCAL_READ_OPTIONS,
} from '../common';

export function InterfacePluralIdField({ schema, name }) {
  const inter = schema[name];
  invariant(inter && inter.kind === 'interface',
    'interface must be passed to resolver');

  return async function(parent, args, info) {
    const { rootValue } = info;
    const { db, config } = rootValue;

    const readOptions = config.committedReads ?
      MAJORITY_READ_OPTIONS :
      LOCAL_READ_OPTIONS;

    if (!args.id || !args.id.length) {
      return [ ];
    }

    const idMap = args.id
      .reduce((acc, id) =>
        inter.implementations.includes(typeFromGlobalId(id)) ?
          {
            ...acc,
            [typeFromGlobalId(id)]:
              (acc[typeFromGlobalId(id)] || [ ]).concat(id)
          } :
          acc,
        { });

    const queries = Object.keys(idMap).map(async typeName => {
      const filter = await permissionFilter(schema, rootValue, typeName);
      if (!filter) {
        return [ ];
      }

      const query = { $and: [
        ...filter,
        {
          _id:
            idMap[typeName].length === 1 ?
              idMap[typeName][0] :
              { $in: idMap[typeName] }
        }
      ]};

      return db.collection(typeName, readOptions)
        .find(query)
        .toArray();
    });

    // Relay requires each plural identifying root field to return results in
    // the same order as specified in the argument list and null if not found:
    const results = await Promise.all(queries);
    const resultsMap = flatten(results)
      .reduce((acc, result) => ({ ...acc, [result._id]: result }), { });
    return args.id.map(id => resultsMap[id] || null);
  };
}
