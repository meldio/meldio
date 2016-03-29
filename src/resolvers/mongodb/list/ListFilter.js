import { SCALAR_TYPES } from '../../../schema/analyzer';
import { encode } from '../../../jsutils/globalId';
import isNullish from '../../../jsutils/isNullish';

export function ListFilter({ schema, typeName }) {

  const isScalarType =
    SCALAR_TYPES.includes(typeName) ||
    schema[typeName] && schema[typeName].kind === 'enum';

  if (isScalarType) {
    return function (filter, list) {
      return list.filter(scalar => scalarFilter(filter, scalar));
    };
  }
  return function (filter, list) {
    return list.filter(obj => objectFilter(filter, typeName, obj));
  };

  function objectFilter(filter, objectTypeName: string, obj): boolean {
    // istanbul ignore if
    if (!objectTypeName || !schema[objectTypeName] || !filter) {
      return true;
    }
    // istanbul ignore if
    if (!obj) {
      return false;
    }

    const type = schema[objectTypeName];

    if (type.kind === 'type' && type.implementsNode) {
      return (filter.id ? scalarFilter(filter.id, obj._id) : true) &&
        fieldsFilter({ ...filter, id: undefined }, type.fields, obj);
    } else if (type.kind === 'type') {
      return fieldsFilter(filter, type.fields, obj);
    } else if (type.kind === 'union' && type.everyTypeImplementsNode) {
      return (filter.id ? scalarFilter(filter.id, obj._id) : true) &&
        (filter.type ? nodeTypeFilter(filter.type, obj) : true);
    } else if (type.kind === 'union') {
      return filter.type ? typeFilter(filter.type, obj) : true;
    } else if (type.kind === 'interface' && type.everyTypeImplementsNode) {
      return (filter.id ? scalarFilter(filter.id, obj._id) : true) &&
        (filter.type ? nodeTypeFilter(filter.type, obj) : true) &&
        fieldsFilter({ ...filter, id: undefined }, type.fields, obj);
    } else if (type.kind === 'interface') {
      return (filter.type ? typeFilter(filter.type, obj) : true) &&
        fieldsFilter(filter, type.fields, obj);
    }
    // istanbul ignore next
    return true;
  }

  function fieldsFilter(filter, fields, obj): boolean {
    return fields
      .filter(field => filter[field.name])
      .reduce(
        (acc, field) =>
          acc && fieldFilter(filter[field.name], field, obj[field.name]),
        true);
  }

  function fieldFilter(filter, field, value): boolean {
    const {
      type,
      isScalar, isObject, isNode,
      isScalarList, isObjectList, isNodeList,
    } = field;

    return isScalar || isNode ? scalarFilter(filter, value) :
           isScalarList || isNodeList ? scalarListFilter(filter, value) :
           isObject ? objectFilter(filter, type, value) :
           isObjectList ? objectListFilter(filter, type, value) :
           true;
  }

  function nodeTypeFilter(filter, { _id: id }) {
    // istanbul ignore if
    if (!id) { return false; }

    if (filter.eq) {
      const encoded = filter.eq.map(tn => encode(tn));
      // istanbul ignore else
      if (encoded.length) {
        return encoded.includes(id.substring(21));
      }
    } else if (filter.ne) {
      const encoded = filter.ne.map(tn => encode(tn));
      // istanbul ignore else
      if (encoded.length) {
        return !encoded.includes(id.substring(21));
      }
    }
    // istanbul ignore next
    return true;
  }

  function typeFilter(filter, { _type: type }) {
    // istanbul ignore if
    if (!type) { return false; }

    if (filter.eq && filter.eq.length) {
      return filter.eq.includes(type);
    } else if (filter.ne && filter.ne.length) {
      return !filter.ne.includes(type);
    }
    // istanbul ignore next
    return true;
  }

  function objectListFilter(filter, type: string, list): boolean {
    return Object.keys(filter || [ ])
      .map(operator => [ operator, filter[operator] ] )
      .reduce( (acc, [ operator, filterFragment ]) =>
        acc && (
          operator === 'length' ?
            filterFragment === list.length :
          operator === 'empty' ?
            filterFragment ?
              list.length === 0 :
              list.length !== 0 :
          operator === 'some' ?
            list.some(element => objectFilter(filterFragment, type, element)) :
          operator === 'every' ?
            !list.some(element =>
              !objectFilter(filterFragment, type, element)) :
          operator === 'none' ?
            !list.some(element => objectFilter(filterFragment, type, element)) :
            true),
      true);
  }

  function scalarListFilter(filter, list): boolean {
    return Object.keys(filter || { })
      .map(operator => [ operator, filter[operator] ] )
      .reduce( (acc, [ operator, filterFragment ]) =>
        acc && (
          operator === 'length' ?
            filterFragment === list.length :
          operator === 'empty' ?
            filterFragment ?
              list.length === 0 :
              list.length !== 0 :
          operator === 'some' ?
            list.some(element => scalarFilter(filterFragment, element)) :
          operator === 'every' ?
            !list.some(element => !scalarFilter(filterFragment, element)) :
          operator === 'none' ?
            !list.some(element => scalarFilter(filterFragment, element)) :
            true),
      true);
  }

  function scalarFilter(filter, value): boolean {
    return Object.keys(filter || { })
      .map(operator => [ operator, filter[operator] ] )
      .reduce( (acc, [ operator, operand ]) =>
        acc && (
          operator === 'eq' && Array.isArray(operand) && operand.length === 1 ?
            value === operand[0] :
          operator === 'eq' && Array.isArray(operand) ?
            operand.includes(value) :
          operator === 'eq' ?
            value === operand :
          operator === 'ne' && Array.isArray(operand) && operand.length === 1 ?
            value !== operand[0] :
          operator === 'ne' && Array.isArray(operand) ?
            !operand.includes(value) :
          operator === 'ne' ?
            value !== operand :
          operator === 'gt' ? value > operand :
          operator === 'gte' ? value >= operand :
          operator === 'lt' ? value < operand :
          operator === 'lte' ? value <= operand :
          operator === 'exists' ?
            operand ?
              !isNullish(value) :
              isNullish(value) :
          operator === 'matches' ? Boolean(value.match(new RegExp(operand))) :
          true),
      true);
  }
}
