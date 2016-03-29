/* @flow */

import invariant from '../../../jsutils/invariant';
import isNullish from '../../../jsutils/isNullish';
import { Filters } from './Filters';

type MongoUpdateExpression = any;

export function Updates(context: any): any {
  const { schema } = context;

  const {
    objectFilter,
    scalarFilter,
  } = Filters({ schema });

  function merge(updates: [MongoUpdateExpression]): MongoUpdateExpression {
    return updates
      .reduce( (acc, update) => {
        const result = { ...acc };
        Object.keys(update).forEach(operation => {
          result[operation] = {
            ...result[operation] || {},
            ...update[operation] };
        });
        return result;
      } , { });
  }

  function updateNode(update, typeName: string, parentPath: string) {
    // istanbul ignore if
    if (!typeName || !schema[typeName] || !update) {
      return { };
    }
    const type = schema[typeName];
    const updates = type.fields
      .filter(field => field.name !== 'id' && !isNullish(update[field.name]))
      .map(field => updateField(update[field.name], field, parentPath));
    return merge(updates);
  }

  function updateObject(update, typeName: string, parentPath: string) {
    // istanbul ignore if
    if (!typeName || !schema[typeName] || !update) {
      return { };
    }

    const type = schema[typeName];
    invariant(type.kind === 'type' || type.kind === 'union' ||
      type.kind === 'interface', 'Object must be type, union or interface.');

    const fields = type.kind === 'type' ?
      type.fields :
      (
        invariant(update._type &&
          schema[update._type] &&
          schema[update._type].kind === 'type',
          'Update expression must have _type field with actual type.'),
        schema[update._type].fields
      );

    const updates = fields
      .filter(field => !isNullish(update[field.name]) )
      .map(field => updateField(update[field.name], field, parentPath));

    const typePath = parentPath ? `${parentPath}._type` : '_type';
    const updateType = update._type ?
      [ { $set: { [typePath]: update._type }} ] :
      [ ];

    return merge(updates.concat(updateType));
  }

  function updateField(update, field, parentPath) {
    const {
      name,
      type,
      isScalar, isNumeric, isObject, isNode,
      isScalarList, isObjectList, isNodeList,
    } = field;
    const path = parentPath ? `${parentPath}.${name}` : name;

    return isScalar && !isNumeric ? updateScalar(update, type, path) :
           isNumeric ? updateNumeric(update, type, path) :
           isNode ? updateScalar(update, 'ID', path) :
           isObject ? updateObject(update, type, path) :
           isScalarList ? updateScalarList(update, type, path) :
           isNodeList ? updateScalarList(update, 'ID', path) :
           isObjectList ? updateObjectList(update, type, path) :
           [ ];
  }

  function updateScalar(update, typeName, path: string) {
    return (
      !isNullish(update.clear) ?
        { $unset: { [path]: '' } } :
        { $set: { [path]: update }}
    );
  }

  function updateNumeric(update, typeName, path: string) {
    return (
      !isNullish(update.clear) ? { $unset: { [path]: '' } } :
      !isNullish(update.add) ? { $inc: { [path]: update.add } } :
      !isNullish(update.sub) ? { $inc: { [path]: -update.sub } } :
      !isNullish(update.mul) ? { $mul: { [path]: update.mul } } :
      update.div ? { $mul: { [path]: 1.0 / update.div } } :
      !isNullish(update.min) ? { $min: { [path]: update.min } } :
      !isNullish(update.max) ? { $max: { [path]: update.max } } :
      { $set: { [path]: update }}
    );
  }

  const mixinKeep = update => ({
    ...!isNullish(update.keepFirst) ? { $slice: update.keepFirst } : { },
    ...!isNullish(update.keepLast) ? { $slice: -update.keepLast } : { },
  });

  function updateScalarList(update, typeName, path: string) {
    return Array.isArray(update) ?
        { $set: { [path]: update } } :
      !isNullish(update.clear) ?
        { $unset: { [path]: '' } } :
      update.insert !== undefined ?     // allows for insert: null
        !isNullish(update.at) ?
          {
            $push: { [path]: {
              $each: [].concat(update.insert),
              $position: update.at,
              ...mixinKeep(update),
            } }
          } :
        update.ascending || update.descending ?
          {
            $push: { [path]: {
              $each: [].concat(update.insert),
              $sort: update.ascending ? 1 : -1,
              ...mixinKeep(update),
            } }
          } :
          // default insert to the tail of the list:
          {
            $push: { [path]: {
              $each: [].concat(update.insert),
              ...mixinKeep(update),
            } }
          } :
      update.delete !== undefined ?   // allows for delete: null
        typeof update.delete === 'object' &&
        !Array.isArray(update.delete) &&
        update.delete !== null ?
          { $pull: { [path]: scalarFilter(update.delete) } } :
          { $pull: { [path]: {$in: [].concat(update.delete) } } } :
      !isNullish(update.pop) ?
        update.pop.toLowerCase() === 'first' ?
          { $pop: { [path]: -1 }} :
        update.pop.toLowerCase() === 'last' ?
          { $pop: { [path]: 1 }} :
          { } :
      { };
  }

  function updateObjectList(update, typeName, path: string) {
    return Array.isArray(update) ?
        { $set: { [path]: update } } :
      !isNullish(update.clear) ?
        { $unset: { [path]: '' } } :
      update.insert !== undefined ? // allows for insert: null
        !isNullish(update.at) ?
          {
            $push: { [path]: {
              $each: [].concat(update.insert),
              $position: update.at,
              ...mixinKeep(update),
            } }
          } :
        update.ascending || update.descending ?
          {
            $push: { [path]: {
              $each: [].concat(update.insert),
              $sort: update.ascending ?
                { [update.ascending]: 1 } :
                { [update.descending]: -1 },
              ...mixinKeep(update),
            } }
          } :
          // default insert to the tail of the list:
          {
            $push: { [path]: {
              $each: [].concat(update.insert),
              ...mixinKeep(update),
            } }
          } :
      update.delete !== undefined ?   // allows for delete: null
        typeof update.delete === 'object' &&
        !Array.isArray(update.delete) &&
        update.delete !== null ?
          {$pull: {[path]: {$and: objectFilter(update.delete, typeName, '')}}} :
          {$pull: {[path]: {$in: [].concat(update.delete) }}} :
      !isNullish(update.pop) ?
        update.pop.toLowerCase() === 'first' ?
          { $pop: { [path]: -1 }} :
        update.pop.toLowerCase() === 'last' ?
          { $pop: { [path]: 1 }} :
          { } :
        { };
  }

  return {
    updateNode,
    updateObject,
    merge
  };
}
