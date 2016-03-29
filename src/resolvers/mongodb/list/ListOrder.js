import isNullish from '../../../jsutils/isNullish';
import { SCALAR_TYPES } from '../../../schema/analyzer';

export function ListOrder({ schema, typeName }) {

  const isScalar =
    SCALAR_TYPES.includes(typeName) ||
    schema[typeName] && schema[typeName].kind === 'enum';
  if (isScalar) {
    return function (order, list) {
      const nullishValues = list.filter(item => isNullish(item));
      const sortedWithoutNullish = list.filter(item => !isNullish(item));
      /* eslint no-implicit-coercion: 0 */
      if (order === 'DESCENDING') {
        sortedWithoutNullish.sort((a,b) => -(+(a > b) || +(a === b) - 1));
      } else {
        sortedWithoutNullish.sort((a,b) => +(a > b) || +(a === b) - 1);
      }
      return nullishValues.concat(sortedWithoutNullish);
    };
  }
  return function (order, list) {
    const sortOrder = order.reduce((acc, o) => [
      ...acc,
      ...Object.keys(o).map(field => [ field , o[field] ])
    ] , [ ]);

    return list.sort( (a, b) => evalOrder(a, b, sortOrder, 0) );
  };

  function evalOrder(a, b, sortOrder, depth) {
    if (depth >= sortOrder.length) {
      return 0;
    }
    const [ fieldName, order ] = sortOrder[depth];

    if (a[fieldName] < b[fieldName]) {
      return order === 'DESCENDING' ? +1 : -1;
    } else if (a[fieldName] > b[fieldName]) {
      return order === 'DESCENDING' ? -1 : +1;
    }
    return evalOrder(a, b, sortOrder, depth + 1);
  }
}
