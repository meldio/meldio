import { Nodes } from '../../../mutations/Nodes';
import { makePermissionContext } from './context';
import { Filters } from './Filters';

export async function permissionFilter(schema, rootValue, typeName, parent) {
  const { permissions, config } = rootValue;

  if (config.enabledAuth.length === 0) {
    return { };
  }

  if (!permissions[typeName] || typeof permissions[typeName] !== 'function') {
    return undefined;
  }
  const permissionCtx = makePermissionContext(schema, rootValue, typeName);
  const filter = await permissions[typeName].apply(permissionCtx, [ ]);

  if (!(filter instanceof Nodes)) {
    return undefined;
  }

  const mongoFilter = Array.isArray(filter.filter) ?
    [ { _id: { $in: filter.filter } } ] :
    Filters({ schema }).objectFilter(filter.filter, typeName, parent || '');

  return mongoFilter;
}
