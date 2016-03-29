import { typeFromGlobalId } from '../../../jsutils/globalId';

export function IsTypeOf({ name }) {

  return function (obj) {
    if (obj._type) {
      return obj._type === name;
    } else if (obj._id) {
      return typeFromGlobalId(obj._id) === name;
    } else if (obj.id) {
      return typeFromGlobalId(obj.id) === name;
    }
    return false;
  };
}
