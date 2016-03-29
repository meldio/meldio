

import { typeFromGlobalId } from '../../../jsutils/globalId';

export function ResolveType({ typeMap }) {

  return function (obj) {
    if (obj._type) {
      return typeMap[obj._type];
    } else if (obj._id) {
      return typeMap[typeFromGlobalId(obj._id)];
    } else if (obj.id) {
      return typeMap[typeFromGlobalId(obj.id)];
    }
    return null;
  };
}
