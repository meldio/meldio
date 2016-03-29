import strip from '../../jsutils/strip';
import invariant from '../../jsutils/invariant';
import isNullish from '../../jsutils/isNullish';
import { validateFields } from './validateFields';
import {
  isValidScalar,
  isValidScalarList,
  hasOp,
  allowedOps,
  typeOp,
  scalarOp,
  scalarListOp,
} from './helpers';

export function validateFilter(context, expression) {
  invariant(context, 'must pass context to validateFilter.');
  invariant(context.schema && context.type &&
    context.schema[context.type] &&
    context.schema[context.type].kind === 'type' &&
    context.schema[context.type].implementsNode,
    'must pass Node context to validateFilter.');

  const { schema, type } = context;
  const prefix = `Filter expression`;
  const options = {
    noConnections: true,
    enforceRequired: false,
    noUndefinedFields: true,
    fieldValidator,
    prefix,
  };
  const path = '';

  const fields = context.schema[type].fields;
  return {
    context,
    results:
      isNullish(expression) || typeof expression !== 'object' ||
      Array.isArray(expression) ?
        [ strip`${prefix} must be an object expression.` ] :
        validateFields(schema, fields, expression, path, options)
  };
}

function fieldValidator(schema, field, filter, parentPath, options) {
  const path = parentPath ? parentPath + '.' + field.name : field.name;
  const { prefix } = options;
  const suffix = `within "${path}" subexpression`;
  const type = field.type;
  const tags = { prefix, suffix };

  return field.isScalar ?
      validateScalarFilter(schema, type, filter, path, tags) :
    field.isScalarList ?
      validateScalarListFilter(schema, type, filter, path, tags) :
    field.isNode ?
      validateScalarFilter(schema, 'ID', filter, path, tags) :
    field.isNodeList ?
      validateScalarListFilter(schema, 'ID', filter, path, tags) :
    field.isObject ?
      validateObjectFilter(schema, type, filter, path, tags) :
    field.isObjectList ?
      validateObjectListFilter(schema, type, filter, path, tags) :
    /* istanbul ignore next */
    [ ];
}

export function validateScalarFilter(schema, type, filter, path, { prefix }) {
  const suffix = `within "${path}" subexpression`;
  const options = { prefix, suffix };

  if (typeof filter !== 'object' || Array.isArray(filter)) {
    return !isValidScalar(schema, type, filter) &&
      !isValidScalarList(schema, type, filter) ?
        [ strip`${prefix} has an invalid scalar value ${suffix}.
               ~ Expected "${type}" scalar value or array.` ] :
        [ ];
  }
  const allowed =
    type === 'Int' ?
      [ 'eq', 'ne', 'lt', 'gt', 'lte', 'gte', 'exists' ] :
    type === 'Float' ?
      [ 'eq', 'ne', 'lt', 'gt', 'lte', 'gte', 'exists' ] :
    type === 'String' ?
      [ 'eq', 'ne', 'lt', 'gt', 'lte', 'gte', 'matches', 'exists' ] :
    type === 'Boolean' ?
      [ 'eq', 'ne', 'exists' ] :
    type === 'ID' ?
      [ 'eq', 'ne', 'lt', 'gt', 'lte', 'gte', 'exists' ] :
    schema[type].kind === 'enum' ?
      [ 'eq', 'ne', 'exists' ] :
    /* istanbul ignore next */
    [ ];
  return [
    ...allowedOps(filter, allowed, path, options),
    ...scalarListOp(schema, 'eq', type, filter, options),
    ...scalarListOp(schema, 'ne', type, filter, options),
    ...scalarOp(schema, 'lt', type, filter, options),
    ...scalarOp(schema, 'gt', type, filter, options),
    ...scalarOp(schema, 'lte', type, filter, options),
    ...scalarOp(schema, 'gte', type, filter, options),
    ...scalarOp(schema, 'exists', 'Boolean', filter, options),
    ...!isNullish(filter.matches) &&
       !isValidScalar(schema, 'String', filter.matches) &&
       !(filter.matches instanceof RegExp) ?
      [ strip`${prefix} has "matches" operator with invalid value ${suffix}.
             ~ Value passed to "matches" operator must be "String" scalar or
             ~ RegExp object.` ] :
      [ ],
  ];
}

function validateScalarListFilter(schema, type, filter, path, options) {
  const allowed = [ 'exists', 'length', 'empty', 'some', 'every', 'none' ];
  return [
    ...allowedOps(filter, allowed, path, options),
    ...scalarOp(schema, 'exists', 'Boolean', filter, options),
    ...scalarOp(schema, 'length', 'Int', filter, options),
    ...scalarOp(schema, 'empty', 'Boolean', filter, options),
    ...hasOp('some', filter) ?
      validateScalarFilter(schema, type, filter.some, path + '.some', options) :
      [ ],
    ...hasOp('every', filter) ?
      validateScalarFilter(
        schema, type, filter.every, path + '.every', options) :
      [ ],
    ...hasOp('none', filter) ?
      validateScalarFilter(schema, type, filter.none, path + '.none', options) :
      [ ],
  ];
}

export function validateObjectFilter(schema, typeName, filter, path, options) {
  const { prefix } = options;
  const type = schema[typeName];
  invariant(type && [ 'type', 'union', 'interface' ].includes(type.kind),
    `validateObjectFilter expects type, union or interface.`);

  const allowed = type.kind === 'type' ? [ 'exists' ] : [ 'exists', 'type' ];

  const fieldOptions = {
    noConnections: true,
    enforceRequired: false,
    noUndefinedFields: true,
    fieldValidator,
    prefix,
    additionalAllowedFields: allowed,
  };

  if (type.kind === 'type') {
    return [
      ...scalarOp(schema, 'exists', 'Boolean', filter, options),
      ...validateFields(schema, type.fields, filter, path, fieldOptions),
    ];
  } else if (type.kind === 'interface') {
    const allowedTypes = type.implementations;
    const typePath = path + '.type';
    return [
      ...scalarOp(schema, 'exists', 'Boolean', filter, options),
      ...typeOp(schema, allowedTypes, filter, typePath, options),
      ...validateFields(schema, type.fields, filter, path, fieldOptions),
    ];
  } else if (type.kind === 'union') {
    const allowedTypes = type.typeNames;
    const typePath = path + '.type';
    return [
      ...allowedOps(filter, allowed, path, options),
      ...scalarOp(schema, 'exists', 'Boolean', filter, options),
      ...typeOp(schema, allowedTypes, filter, typePath, options),
    ];
  }

}

function validateObjectListFilter(schema, type, filter, path, options) {
  const allowed = [ 'exists', 'length', 'empty', 'some', 'every', 'none' ];
  return [
    ...allowedOps(filter, allowed, path, options),
    ...scalarOp(schema, 'exists', 'Boolean', filter, options),
    ...scalarOp(schema, 'length', 'Int', filter, options),
    ...scalarOp(schema, 'empty', 'Boolean', filter, options),
    ...hasOp('some', filter) ?
      validateObjectFilter(schema, type, filter.some, path + '.some', options) :
      [ ],
    ...hasOp('every', filter) ?
      validateObjectFilter(
        schema, type, filter.every, path + '.every', options) :
      [ ],
    ...hasOp('none', filter) ?
      validateObjectFilter(schema, type, filter.none, path + '.none', options) :
      [ ],
  ];
}
