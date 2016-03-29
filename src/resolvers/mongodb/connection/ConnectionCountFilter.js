/* @flow */
import type { ResolverContext } from '../../types';
import { SCALAR_TYPES } from '../../../schema/analyzer';
import flatten from '../../../jsutils/flatten2';
import { encode } from '../../../jsutils/globalId';

type FilterExpression = any;
type MongoCountExpression = any;
type Filter = (filter: FilterExpression) => MongoCountExpression;

const hasEdgeFilter = filter =>
  Object.keys(filter)
    .filter(key => key !== 'node')
    .length !== 0;

export function ConnectionCountFilter(context: ResolverContext): Filter {
  const { schema, edge, node } = context;

  let currentObjectId = 0;
  function getObjectId() { return `object${currentObjectId++}`; }

  const nodeIsScalar =
    SCALAR_TYPES.includes(node) ||
    schema[node] && schema[node].kind === 'enum';

  if (nodeIsScalar) {
    return function (filter) {
      return {$cond: {
        if: {$and: [
          ...filter.node ?
            fieldFilter(filter.node, { isScalar: true, name: 'node' }, '') :
            [ ],
          ...hasEdgeFilter(filter) ?
            objectFilter(filter, edge, 'edgeProps') :
            [ ],
          { }
        ]},
        then: 1,
        else: 0
      }};
    };
  }

  return function (filter) {
    return {$cond: {
      if: {$and: [
        ...filter.node ?
          objectFilter(filter.node, node, 'node') :
          [ ],
        ...hasEdgeFilter(filter) ?
          objectFilter(filter, edge, 'edgeProps') :
          [ ],
        { }
      ]},
      then: 1,
      else: 0
    }};
  };

  function objectFilter(filter, typeName: string, path: string) {
    // istanbul ignore if
    if (!typeName || !schema[typeName] || !filter) {
      return [ ];
    }

    const type = schema[typeName];
    const idPath = path ? `${path}._id` : `_id`;
    const typePath = path ? `${path}._type` : `_type`;

    const exists = f =>
      path && f.exists === true ? [ { $ne: [ '$' + path, null ] } ] :
      path && f.exists === false ? [ { $eq: [ '$' + path, null ] } ] :
      [ ];

    if (type.kind === 'type' && type.implementsNode) {
      return [
        ...exists(filter),
        ...filter.id ? scalarFilter(filter.id, idPath) : [ ],
        ...fieldsFilter({ ...filter, id: undefined }, type.fields, path)
      ];
    } else if (type.kind === 'type') {
      return [
        ...exists(filter),
        ...fieldsFilter(filter, type.fields, path)
      ];
    } else if (type.kind === 'union' && type.everyTypeImplementsNode) {
      return [
        ...exists(filter),
        ...filter.id ? scalarFilter(filter.id, idPath) : [ ],
        ...filter.type ? typeFilter(filter.type, path) : [ ],
      ];
    } else if (type.kind === 'union') {
      return [
        ...exists(filter),
        ...filter.type ? scalarFilter(filter.type, typePath) : [ ]
      ];
    } else if (type.kind === 'interface' && type.everyTypeImplementsNode) {
      return [
        ...exists(filter),
        ...filter.id ? scalarFilter(filter.id, idPath) : [ ],
        ...filter.type ? typeFilter(filter.type, path) : [ ],
        ...fieldsFilter({ ...filter, id: undefined }, type.fields, path)
      ];
    } else if (type.kind === 'interface') {
      return [
        ...exists(filter),
        ...filter.type ? scalarFilter(filter.type, typePath) : [ ],
        ...fieldsFilter({ ...filter, id: undefined }, type.fields, path)
      ];
    }
    // istanbul ignore next
    return [ ];
  }

  function fieldsFilter(filter, fields, path: string): Array<Object> {
    return flatten(
      fields
        .filter(field => filter[field.name])
        .map(field => fieldFilter(filter[field.name], field, path)));
  }

  function fieldFilter(filter, field, path: string): Array<Object> {
    const {
      name,
      type,
      isScalar, isObject, isNode,
      isScalarList, isObjectList, isNodeList,
    } = field;
    const fieldPath = path ? `${path}.${name}` : name;

    return isScalar || isNode ? scalarFilter(filter, fieldPath) :
           isScalarList || isNodeList ? scalarListFilter(filter, fieldPath) :
           isObject ? objectFilter(filter, type, fieldPath) :
           isObjectList ? objectListFilter(filter, type, fieldPath) :
           [ ];
  }

  function typeFilter(filter, path) {
    const idPath = path ? `${path}._id` : `_id`;

    if (filter.eq) {
      const encoded = filter.eq.map(typeName => encode(typeName));
      // istanbul ignore next
      if (encoded.length) {
        return [ { $or: encoded.map(type =>
          ({$eq: [ {$substr: [ '$' + idPath, 21, -1 ]}, type ] })
        )} ];
      }
      // istanbul ignore next
      return [ ];
    } else if (filter.ne) {
      const encoded = filter.ne.map(typeName => encode(typeName));
      // istanbul ignore next
      if (encoded.length) {
        return [ { $and: encoded.map(type =>
          ({$ne: [ {$substr: [ '$' + idPath, 21, -1 ]}, type ] })
        )} ];
      }
      // istanbul ignore next
      return [ ];
    }
    // istanbul ignore next
    return [ ];
  }

  // .concat({ }) is to avoid mongo wrath where $and: [ ] causes an error
  function objectListFilter(filter, type: string, path: string): Array<Object> {
    let objectId = '';
    return Object.keys(filter || { })
      .map(operator => [ operator, filter[operator] ] )
      .reduce( (acc, [ operator, filterFragment ]) =>
        operator === 'exists' && filterFragment ?
          acc.concat({ $isArray: '$' + path }) :
        operator === 'exists' && !filterFragment ?
          acc.concat({ $not: { $isArray: '$' + path }}) :
        operator === 'length' ?
          acc.concat({
            $cond: {
              if: { $isArray: '$' + path },
              then: {$eq: [ { $size: '$' + path }, filterFragment ]},
              else: false
            }
          }) :
        operator === 'empty' ?
          filterFragment ?
            acc.concat({
              $cond: {
                if: { $isArray: '$' + path },
                then: { $eq: [ { $size: '$' + path }, 0 ] },
                else: false
              }
            }) :
            acc.concat({
              $cond: {
                if: { $isArray: '$' + path },
                then: { $ne: [ { $size: '$' + path }, 0 ] },
                else: false
              }
            }) :
        operator === 'some' ? (
          objectId = getObjectId(),
          acc.concat({
            $cond: {
              if: { $isArray: '$' + path },
              then: {
                $anyElementTrue: [ {
                  $map: {
                    input: '$' + path,
                    as: objectId,
                    in: {
                      $and: objectFilter(filterFragment, type, '$' + objectId)
                    }
                  }
                } ]
              },
              else: false
            }
          }) ) :
        operator === 'every' ? (
          objectId = getObjectId(),
          acc.concat({
            $cond: {
              if: { $isArray: '$' + path },
              then: {
                $allElementsTrue: [ {
                  $map: {
                    input: '$' + path,
                    as: objectId,
                    in: {
                      $and: objectFilter(filterFragment, type, '$' + objectId)
                    }
                  }
                } ]
              },
              else: true
            }
          }) ) :
        operator === 'none' ? (
          objectId = getObjectId(),
          acc.concat({
            $cond: {
              if: { $isArray: '$' + path },
              then: {
                $not: {
                  $anyElementTrue: [ {
                    $map: {
                      input: '$' + path,
                      as: objectId,
                      in: {
                        $and: objectFilter(filterFragment, type, '$' + objectId)
                      }
                    }
                  } ]
                }
              },
              else: true
            }
          }) ) :
          acc,
      [ ]);
  }

  function scalarListFilter(filter, path): Array<Object> {
    return Object.keys(filter || { })
      .map(operator => [ operator, filter[operator] ] )
      .reduce( (acc, [ operator, filterFragment ] ) =>
        operator === 'exists' && filterFragment ?
          acc.concat({ $isArray: '$' + path }) :
        operator === 'exists' && !filterFragment ?
          acc.concat({ $not: { $isArray: '$' + path }}) :
        operator === 'length' ?
          acc.concat({
            $cond: {
              if: { $isArray: '$' + path },
              then: {$eq: [ { $size: '$' + path }, filterFragment ]},
              else: false
            }
          }) :
        operator === 'empty' ?
          filterFragment ?
            acc.concat({
              $cond: {
                if: { $isArray: '$' + path },
                then: { $eq: [ { $size: '$' + path }, 0 ] },
                else: false
              }
            }) :
            acc.concat({
              $cond: {
                if: { $isArray: '$' + path },
                then: { $ne: [ { $size: '$' + path }, 0 ] },
                else: false
              }
            }) :
        operator === 'some' ?
          acc.concat({
            $cond: {
              if: { $isArray: '$' + path },
              then: {
                $anyElementTrue: [ {
                  $map: {
                    input: '$' + path,
                    as: 'value',
                    in: {$and: scalarFilter(filterFragment, '$value')}
                  }
                } ]
              },
              else: false
            }
          }) :
        operator === 'every' ?
          acc.concat({
            $cond: {
              if: { $isArray: '$' + path },
              then: {
                $allElementsTrue: [ {
                  $map: {
                    input: '$' + path,
                    as: 'value',
                    in: {$and: scalarFilter(filterFragment, '$value')}
                  }
                } ]
              },
              else: true
            }
          }) :
        operator === 'none' ?
          acc.concat({
            $cond: {
              if: { $isArray: '$' + path },
              then: {
                $not: {
                  $anyElementTrue: [ {
                    $map: {
                      input: '$' + path,
                      as: 'value',
                      in: {$and: scalarFilter(filterFragment, '$value')}
                    }
                  } ]
                }
              },
              else: true
            }
          }) :
          acc,
      [ ]);
  }

  // isNegated added to avoid Mongo wrath with $not: { $regex } expression
  function scalarFilter(filter, path): Array<Object> {
    return Object.keys(filter || { })
      .map(operator => [ operator, filter[operator] ] )
      .reduce( (acc, [ operator, value ]) =>
        operator === 'exists' && value ?
          acc.concat({ $ne: [ '$' + path, null ] }) :
        operator === 'exists' && !value ?
          acc.concat({ $eq: [ '$' + path, null ] }) :
        operator === 'eq' ?
          acc.concat({ $or:
            [].concat(value).map(v => ({$eq: [ '$' + path, v ]}) ) }) :
        operator === 'ne' ?
          acc.concat({ $and:
            [].concat(value).map(v => ({$ne: [ '$' + path, v ]}) ) }) :
        operator === 'gt' ?
          acc.concat({ $gt: [ '$' + path, value ] }) :
        operator === 'gte' ?
          acc.concat({ $gte: [ '$' + path, value ] }) :
        operator === 'lt' ?
          acc.concat({ $lt: [ '$' + path, value ] }) :
        operator === 'lte' ?
          acc.concat({ $lte: [ '$' + path, value ] }) :
        operator === 'matches' ?
          acc.concat({ $eq: [ '$' + path, value ] }) :
        acc,
      [ ]);
  }
}
