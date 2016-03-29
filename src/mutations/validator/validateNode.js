
import invariant from '../../jsutils/invariant';
import strip from '../../jsutils/strip';
import isNullish from '../../jsutils/isNullish';
import { typeFromGlobalId, isGlobalId } from '../../jsutils/globalId';
import { validateFields } from './validateFields';
import {
  isValidNodeId,
  isValidNodeIdList,
  isValidScalar,
  isValidScalarList,
} from './helpers';

export function validateNode(context, object) {
  invariant(context, 'must pass context to validateNode.');
  invariant(context.schema && context.type &&
    context.schema[context.type] &&
    context.schema[context.type].kind === 'type' &&
    context.schema[context.type].implementsNode,
    'must pass Node context to validateNode.');

  const { schema, function: func, type } = context;
  const prefix = `Object passed to ${func}`;
  const options = {
    noConnections: true,
    enforceRequired: true,
    noUndefinedFields: true,
    fieldValidator,
    prefix,
  };
  const path = '';

  let fields = [ ];
  const results =
    isNullish(object) || typeof object !== 'object' ||
    Array.isArray(object) ?
      [ strip`Value passed to ${func} must be a node object.` ] :
    isNullish(object.id) ?
      [ `${prefix} is missing an id field.` ] :
    !isGlobalId(object.id) ?
      [ `${prefix} has an invalid id field.` ] :
    typeFromGlobalId(object.id) !== type ?
      [ strip`${prefix} has an id field for "${typeFromGlobalId(object.id)}"
             ~ type where an id for "${type}" type is expected.` ] :
    (
      fields = context.schema[type].fields,
      validateFields(schema, fields, object, path, options)
    );

  return { context, results };
}

function fieldValidator(schema, field, value, path, options) {
  const fullPath = path ? path + '.' + field.name : field.name;
  const { prefix } = options;
  const suffix = `in field "${fullPath}".`;
  const type = field.type;

  return field.isScalar && !isValidScalar(schema, type, value) ?
      [ `${prefix} should have "${type}" value ${suffix}` ] :
    field.isScalarList && !isValidScalarList(schema, type, value) ?
      [ `${prefix} should have an array of "${type}" ${suffix}` ] :
    field.isNode && !isValidNodeId(schema, type, value) ?
      [ `${prefix} should have "${type}" Node ID ${suffix}` ] :
    field.isNodeList && !isValidNodeIdList(schema, type, value) ?
      [ `${prefix} should have an array of "${type}" Node IDs ${suffix}` ] :
    field.isObject ?
      objectValidator(schema, type, value, fullPath, options) :
    field.isObjectList && !Array.isArray(value) ?
      [ `${prefix} should have an array of "${type}" objects ${suffix}` ] :
    field.isObjectList ?
      value.reduce(
        (acc, elem, ix) => acc.concat(
          objectValidator(schema, type, elem, `${fullPath}[${ix}]`, options)),
        [ ]) :
      [ ];
}

export function objectValidator(schema, typeName, value, path, options) {
  const { prefix } = options;
  const suffix = `in "${path}" field.`;
  const type = schema[typeName];
  let fields = [ ];

  if (typeof value !== 'object' || Array.isArray(value)) {
    return [ `${prefix} should have "${typeName}" object ${suffix}` ];
  }

  if (type.kind === 'type') {
    fields = type.fields;
  } else if (type.kind === 'interface') {
    if (value._type) {
      if (type.implementations.includes(value._type) &&
          schema[value._type].kind === 'type') {
        fields = schema[value._type].fields;
      } else {
        return [
          `${prefix} contains object with an invalid "_type" value ${suffix}`
        ];
      }
    } else if (type.implementations.length === 1 &&
      schema[type.implementations[0]].kind === 'type') {
      fields = schema[type.implementations[0]].fields;
    } else {
      return [
        `${prefix} must disambiguate object type with "_type" ${suffix}`
      ];
    }
  } else if (type.kind === 'union') {
    if (value._type) {
      if (type.typeNames.includes(value._type) &&
          schema[value._type].kind === 'type') {
        fields = schema[value._type].fields;
      } else {
        return [
          `${prefix} contains object with an invalid "_type" value ${suffix}`
        ];
      }
    } else if (type.typeNames.length === 1 &&
      schema[type.typeNames[0]].kind === 'type') {
      fields = schema[type.typeNames[0]].fields;
    } else {
      return [
        `${prefix} must disambiguate object type with "_type" ${suffix}`
      ];
    }
  }
  invariant(fields, 'Must see fields in objectValidator');

  const fieldOptions = {
    noConnections: true,
    enforceRequired: true,
    noUndefinedFields: true,
    prefix,
    fieldValidator,
    additionalAllowedFields: [ '_type' ],
  };

  return validateFields(schema, fields, value, path, fieldOptions);
}
