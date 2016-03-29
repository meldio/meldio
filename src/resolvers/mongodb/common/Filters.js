/* @flow */

import flatten from '../../../jsutils/flatten2';
import { encode } from '../../../jsutils/globalId';

export function Filters(context: any): any {
  const { schema } = context;

  function objectFilter(filter, typeName: string, parentPath: string) {
    // istanbul ignore if
    if (!typeName || !schema[typeName] || !filter) {
      return [ ];
    }

    const type = schema[typeName];
    const idPath = parentPath ? `${parentPath}._id` : `_id`;
    const typePath = parentPath ? `${parentPath}._type` : `_type`;

    const exists = f =>
      parentPath && f.exists === true ? [ { [parentPath]: {$ne: null } } ] :
      parentPath && f.exists === false ? [ { [parentPath]: {$eq: null } } ] :
      [ ];

    if (type.kind === 'type' && type.implementsNode) {
      return [
        ...exists(filter),
        ...filter.id ? [ { [idPath]: scalarFilter(filter.id) } ] : [ ],
        ...fieldsFilter({ ...filter, id: undefined }, type.fields, parentPath)
      ];
    } else if (type.kind === 'type') {
      return [
        ...exists(filter),
        ...fieldsFilter(filter, type.fields, parentPath)
      ];
    } else if (type.kind === 'union' && type.everyTypeImplementsNode) {
      return [
        ...exists(filter),
        ...filter.id ? [ { [idPath]: scalarFilter(filter.id) } ] : [ ],
        ...filter.type ? typeFilter(filter.type, parentPath) : [ ],
      ];
    } else if (type.kind === 'union') {
      return [
        ...exists(filter),
        ...filter.type ? [ { [typePath]: scalarFilter(filter.type) } ] : [ ]
      ];
    } else if (type.kind === 'interface' && type.everyTypeImplementsNode) {
      return [
        ...exists(filter),
        ...filter.id ? [ { [idPath]: scalarFilter(filter.id) } ] : [ ],
        ...filter.type ? typeFilter(filter.type, parentPath) : [ ],
        ...fieldsFilter({ ...filter, id: undefined }, type.fields, parentPath)
      ];
    } else if (type.kind === 'interface') {
      return [
        ...exists(filter),
        ...filter.type ? [ { [typePath]: scalarFilter(filter.type) } ] : [ ],
        ...fieldsFilter(filter, type.fields, parentPath)
      ];
    }
    // istanbul ignore next
    return [ ];
  }

  function fieldsFilter(filter, fields, parentPath: string): Array<Object> {
    return flatten(
      fields
        .filter(field => filter[field.name])
        .map(field => fieldFilter(filter[field.name], field, parentPath)));
  }

  function fieldFilter(filter, field, parentPath: string): Array<Object> {
    const {
      name,
      type,
      isScalar, isObject, isNode,
      isScalarList, isObjectList, isNodeList,
    } = field;
    const path = parentPath ? `${parentPath}.${name}` : name;
    const addPath = expression => ({ [path]: expression });

    return isScalar || isNode ? [ addPath(scalarFilter(filter)) ] :
           isScalarList || isNodeList ? scalarListFilter(filter).map(addPath) :
           isObject ? objectFilter(filter, type, path) :
           isObjectList ? objectListFilter(filter, type).map(addPath) :
           [ ];
  }

  function typeFilter(filter, parentPath): any {
    const idPath = parentPath ? `${parentPath}._id` : `_id`;
    if (typeof filter !== 'object' || Array.isArray(filter)) {
      const encoded = [].concat(filter).map(typeName => encode(typeName));
      // istanbul ignore else
      if (encoded.length) {
        return [ {
          $or: encoded.map(type => ({ [idPath]: {$regex: `-${type}$`} }))
        } ];
      }
      // istanbul ignore next
      return [ ];
    } else if (filter.eq) {
      const encoded = filter.eq.map(typeName => encode(typeName));
      // istanbul ignore else
      if (encoded.length) {
        return [
          { $or: encoded.map(type => ({ [idPath]: {$regex: `-${type}$`} })) }
        ];
      }
      // istanbul ignore next
      return [ ];
    } else if (filter.ne) {
      const encoded = filter.ne.map(typeName => encode(typeName));
      // istanbul ignore else
      if (encoded.length) {
        return [ {
          $and: encoded.map(type =>
            ({ [idPath]: {$not: new RegExp(`-${type}$`)} }))
        } ];
      }
      // istanbul ignore next
      return [ ];
    }
    // istanbul ignore next
    return [ ];
  }

  // .concat({ }) is to avoid mongo wrath where $and: [ ] causes an error
  function objectListFilter(filter, type: string): Array<Object> {
    const noPath = '';
    return Object.keys(filter || { })
      .map(operator => [ operator, filter[operator] ] )
      .reduce( (acc, [ operator, filterFragment ]) =>
        // FIXME: exists: true will not match array like: [1,2,null] due to
        // mongodb bug / feature
        operator === 'exists' && filterFragment ?
          acc.concat({ $ne: null }) :
        operator === 'exists' && !filterFragment ?
          acc.concat({ $not: {$elemMatch: {$exists: true}} })
             .concat({ $not: {$size: 0} }) :
        operator === 'length' ?
          acc.concat({ $size: filterFragment }) :
        operator === 'empty' ?
          filterFragment ?
            acc.concat({ $size: 0 }) :
            acc.concat({ $elemMatch: { $exists: true } }) :
        operator === 'some' ?
          acc.concat({
            $elemMatch: {
              $and:
                objectFilter(filterFragment, type, noPath)
                  .concat({ })
            }}) :
        operator === 'every' ?
          acc.concat({
            $not: {
              $elemMatch: {
                $or:
                  objectFilter(filterFragment, type, noPath)
                    .map(obj =>
                      Object.keys(obj)
                        .map(key => ({ [key]: {$not: obj[key]}}))
                        .reduce( (a, e) => ({...a, ...e}), { }))
              }
            }
          }) :
        operator === 'none' ?
          acc.concat({
            $not: {
              $elemMatch: {
                $and:
                  objectFilter(filterFragment, type, noPath)
                    .concat({ })
              }}}) :
          acc,
      [ ]);
  }

  function scalarListFilter(filter): Array<Object> {
    return Object.keys(filter || { })
      .map(operator => [ operator, filter[operator] ] )
      .reduce( (acc, [ operator, filterFragment ]) =>
        // FIXME: exists: true will not match array like: [1,2,null] due to
        // mongodb bug / feature
        operator === 'exists' && filterFragment ?
          acc.concat({ $ne: null }) :
        operator === 'exists' && !filterFragment ?
          acc.concat({ $not: {$elemMatch: {$exists: true}} })
             .concat({ $not: {$size: 0} }) :
        operator === 'length' ?
          acc.concat({ $size: filterFragment }) :
        operator === 'empty' ?
          filterFragment ?
            acc.concat({ $size: 0 }) :
            acc.concat({ $elemMatch: { $exists: true } }) :
        operator === 'some' ?
          acc.concat({ $elemMatch: scalarFilter(filterFragment) }) :
        operator === 'every' ?
          acc.concat(
            {$not: {$elemMatch: {$not: scalarFilter(filterFragment)}}}
          ) :
        operator === 'none' ?
          acc.concat({$not: {$elemMatch: scalarFilter(filterFragment) }}) :
          acc,
      [ ]);
  }

  function scalarFilter(filter): Object {
    return typeof filter === 'object' && !Array.isArray(filter) ?
      Object.keys(filter || { })
        .map(operator => [ operator, filter[operator] ] )
        .reduce( (acc, [ operator, value ]) =>
          operator === 'exists' && value ? { ...acc, $ne: null } :
          operator === 'exists' && !value ? { ...acc, $eq: null } :
          operator === 'eq' ? { ...acc, $in: [].concat(value) } :
          operator === 'ne' ? { ...acc, $nin: [].concat(value) } :
          operator === 'gt' ? { ...acc, $gt: value } :
          operator === 'gte' ? { ...acc, $gte: value } :
          operator === 'lt' ? { ...acc, $lt: value } :
          operator === 'lte' ? { ...acc, $lte: value } :
          operator === 'matches' ? { ...acc, $not: {$not: new RegExp(value) }} :
          acc,
        { }) :
        { $in: [ ].concat(filter) };
  }

  return {
    objectFilter,
    fieldsFilter,
    fieldFilter,
    typeFilter,
    scalarFilter
  };
}
