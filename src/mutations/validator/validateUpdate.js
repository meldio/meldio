import strip from '../../jsutils/strip';
import invariant from '../../jsutils/invariant';
import isNullish from '../../jsutils/isNullish';
import { validateFields } from './validateFields';
import {
  isValidNodeId,
  isValidNodeIdList,
  isValidScalar,
  isValidScalarList,
  allowedOps,
  atMostOneOp,
  scalarOp,
  scalarOpVal,
  scalarListOp,
  nodeIdListOp,
  hasOp,
} from './helpers';
import { objectValidator } from './validateNode';
import { validateScalarFilter, validateObjectFilter } from './validateFilter';

export function validateUpdate(context, expression) {
  invariant(context, 'must pass context to validateUpdate.');
  invariant(context.schema && context.type &&
    context.schema[context.type] &&
    context.schema[context.type].kind === 'type' &&
    context.schema[context.type].implementsNode,
    'must pass Node context to validateUpdate.');

  const { schema, type } = context;
  const prefix = `Update expression`;
  const options = {
    noConnections: true,
    enforceRequired: false,
    noUndefinedFields: true,
    fieldValidator,
    prefix,
  };
  const path = '';

  const fields = context.schema[type].fields;
  const results =
    isNullish(expression) || typeof expression !== 'object' ||
    Array.isArray(expression) ?
      [ strip`${prefix} must be an object expression.` ] :
    !isNullish(expression.id) ?
      [ `${prefix} can not include an id field.` ] :
      validateFields(schema, fields, expression, path, options);

  return { context, results };
}

function fieldValidator(schema, field, exp, parentPath, { prefix }) {
  const path = parentPath ? `${parentPath}.${field.name}` : field.name;
  const suffix = `in "${path}" field`;
  const type = field.type;
  const options = { prefix, suffix };

  return field.isRequired && hasOp('clear', exp) && exp.clear === true ?
      [ strip`${prefix} has a "clear" operator ${suffix}.
             ~ Clear operator can not be applied to a required field.` ] :
    field.isScalar && !field.isNumeric ?
      validateScalarUpdate(schema, type, exp, path, options) :
    field.isNumeric ?
      validateNumericUpdate(schema, type, exp, path, options) :
    field.isScalarList ?
      validateScalarListUpdate(schema, type, exp, path, options) :
    field.isNode ?
      validateNodeUpdate(schema, type, exp, path, options) :
    field.isNodeList ?
      validateNodeListUpdate(schema, type, exp, path, options) :
    field.isObject ?
      validateObjectUpdate(schema, type, exp, path, options) :
    field.isObjectList ?
      validateObjectListUpdate(schema, type, exp, path, options) :
      /* istanbul ignore next */
      [ ];
}

function validateScalarUpdate(schema, type, exp, path, options) {
  const { prefix, suffix } = options;
  return hasOp('clear', exp) ? [
    ...allowedOps(exp, [ 'clear' ], path, options),
    ...scalarOp(schema, 'clear', 'Boolean', exp, options) ] :
  !isValidScalar(schema, type, exp) ?
    [ strip`${prefix} has an unexpected value ${suffix}.
           ~ Expected "${type}" scalar value or "clear" operator
           ~ expression.` ] :
    [ ];
}

function validateNumericUpdate(schema, type, exp, path, options) {
  const { prefix, suffix } = options;
  return hasOp('clear', exp) ? [
    ...allowedOps(exp, [ 'clear' ], path, options),
    ...scalarOp(schema, 'clear', 'Boolean', exp, options) ] :
  hasOp('add', exp) ? [
    ...allowedOps(exp, [ 'add' ], path, options),
    ...scalarOp(schema, 'add', type, exp, options) ] :
  hasOp('sub', exp) ? [
    ...allowedOps(exp, [ 'sub' ], path, options),
    ...scalarOp(schema, 'sub', type, exp, options) ] :
  hasOp('mul', exp) ? [
    ...allowedOps(exp, [ 'mul' ], path, options),
    ...scalarOp(schema, 'mul', type, exp, options) ] :
  hasOp('div', exp) ? [
    ...allowedOps(exp, [ 'div' ], path, options),
    ...scalarOp(schema, 'div', type, exp, options),
    ...exp.div === 0 ?
      [ strip`${prefix} has invalid "div" operator value of zero ${suffix}.
             ~ Division by zero is not allowed.` ] :
      [ ]
  ] :
  hasOp('min', exp) ? [
    ...allowedOps(exp, [ 'min' ], path, options),
    ...scalarOp(schema, 'min', type, exp, options) ] :
  hasOp('max', exp) ? [
    ...allowedOps(exp, [ 'max' ], path, options),
    ...scalarOp(schema, 'max', type, exp, options) ] :
  !isValidScalar(schema, type, exp) ?
    [ strip`${prefix} has an unexpected value ${suffix}.
           ~ Expected "${type}" scalar value or "clear" operator
           ~ expression.` ] :
    [ ];
}

function validateNodeUpdate(schema, type, exp, path, options) {
  const { prefix, suffix } = options;
  return hasOp('clear', exp) ? [
    ...allowedOps(exp, [ 'clear' ], path, options),
    ...scalarOp(schema, 'clear', 'Boolean', exp, options) ] :
  !isValidNodeId(schema, type, exp) ?
    [ strip`${prefix} has an invalid node id value ${suffix}.
           ~ Expected "${type}" node id value.` ] :
    [ ];
}

export function validateObjectUpdate(schema, typeName, exp, path, opts = { }) {
  invariant(schema, 'must pass schema to validateObjectUpdate.');
  invariant(schema[typeName] &&
    [ 'type', 'interface', 'union' ].includes(schema[typeName].kind) &&
    !schema[typeName].implementsNode &&
    !schema[typeName].everyTypeImplementsNode,
    'must pass non-Node object to validateObjectUpdate.');

  const prefix = opts.prefix;
  const suffix = opts.suffix || `in "${path}" field.`;
  const type = schema[typeName];
  let fields = [ ];

  if (typeof exp !== 'object' || Array.isArray(exp)) {
    return [ `${prefix} should have "${typeName}" object ${suffix}` ];
  }

  if (type.kind === 'type') {
    fields = type.fields;
  } else if (type.kind === 'interface') {
    if (exp._type) {
      if (type.implementations.includes(exp._type) &&
          schema[exp._type].kind === 'type') {
        fields = schema[exp._type].fields;
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
    if (exp._type) {
      if (type.typeNames.includes(exp._type) &&
          schema[exp._type].kind === 'type') {
        fields = schema[exp._type].fields;
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
  invariant(fields, 'Must see some fields in validateObjectUpdate');

  const options = {
    noConnections: true,
    enforceRequired: false,
    noUndefinedFields: true,
    fieldValidator,
    additionalAllowedFields: [ '_type' ],
    prefix,
  };

  return validateFields(schema, fields, exp, path, options);
}

function validateScalarListUpdate(schema, type, exp, path, options) {
  const { prefix, suffix } = options;
  const topLevelOps =
    [ 'insert', 'delete', 'pop', 'clear' ].map(o => `"${o}"`).join(', ');
  return hasOp('insert', exp) ? [
    ...allowedOps(exp, [ 'insert', 'at', 'ascending', 'descending',
                         'keepFirst', 'keepLast' ], path, options),
    ...atMostOneOp(exp, [ 'at', 'ascending', 'descending' ], path, options),
    ...scalarListOp(schema, 'insert', type, exp, options),
    ...scalarOp(schema, 'at', 'Int', exp, options),
    ...scalarOp(schema, 'ascending', 'Boolean', exp, options),
    ...scalarOp(schema, 'descending', 'Boolean', exp, options),
    ...scalarOp(schema, 'keepFirst', 'Int', exp, options),
    ...scalarOp(schema, 'keepLast', 'Int', exp, options) ] :
  hasOp('delete', exp) ? [
    ...allowedOps(exp, [ 'delete' ], path, options),
    ...typeof exp.delete === 'object' && !Array.isArray(exp.delete) ?
      validateScalarFilter(
        schema, type, exp.delete, `${path}.delete`, options) :
      scalarListOp(schema, 'delete', type, exp, options) ] :
  hasOp('pop', exp) ? [
    ...allowedOps(exp, [ 'pop' ], path, options),
    ...typeof exp.pop !== 'string' ||
       exp.pop.toLowerCase() !== 'first' &&
       exp.pop.toLowerCase() !== 'last' ?
      [ strip`${prefix} has an invalid "pop" operator ${suffix}. Value
             ~ passed to "pop" operator must be a String that is either
             ~ "first" or "last".` ] :
      [ ]
  ] :
  hasOp('clear', exp) ? [
    ...allowedOps(exp, [ 'clear' ], path, options),
    ...scalarOp(schema, 'clear', 'Boolean', exp, options) ] :
  !Array.isArray(exp) ?
    [ strip`${prefix} has an unexpected value ${suffix}.
           ~ Expected "${type}" array or ${topLevelOps} operator
           ~ expression.` ] :
  !isValidScalarList(schema, type, exp) ?
    [ strip`${prefix} has an invalid array value ${suffix}.
           ~ Expected "${type}" array or ${topLevelOps} operator
           ~ expression.` ] :
    [ ];
}

function validateNodeListUpdate(schema, type, exp, path, options) {
  const { prefix, suffix } = options;
  const topLevelOps =
    [ 'insert', 'delete', 'pop', 'clear' ].map(o => `"${o}"`).join(', ');
  return hasOp('insert', exp) ? [
    ...allowedOps(exp, [ 'insert', 'at', 'ascending', 'descending',
                         'keepFirst', 'keepLast' ], path, options),
    ...atMostOneOp(exp, [ 'at', 'ascending', 'descending' ], path, options),
    ...nodeIdListOp(schema, 'insert', type, exp, options),
    ...scalarOp(schema, 'at', 'Int', exp, options),
    ...scalarOp(schema, 'ascending', 'Boolean', exp, options),
    ...scalarOp(schema, 'descending', 'Boolean', exp, options),
    ...scalarOp(schema, 'keepFirst', 'Int', exp, options),
    ...scalarOp(schema, 'keepLast', 'Int', exp, options) ] :
  hasOp('delete', exp) ? [
    ...allowedOps(exp, [ 'delete' ], path, options),
    ...typeof exp.delete === 'object' && !Array.isArray(exp.delete) ?
      validateScalarFilter(
        schema, 'ID', exp.delete, `${path}.delete`, options) :
      nodeIdListOp(schema, 'delete', type, exp, options) ] :
  hasOp('pop', exp) ? [
    ...allowedOps(exp, [ 'pop' ], path, options),
    ...typeof exp.pop !== 'string' ||
       exp.pop.toLowerCase() !== 'first' &&
       exp.pop.toLowerCase() !== 'last' ?
      [ strip`${prefix} has an invalid "pop" operator ${suffix}. Value
             ~ passed to "pop" operator must be a String that is either
             ~ "first" or "last".` ] :
      [ ] ] :
  hasOp('clear', exp) ? [
    ...allowedOps(exp, [ 'clear' ], path, options),
    ...scalarOp(schema, 'clear', 'Boolean', exp, options) ] :
  !Array.isArray(exp) ?
    [ strip`${prefix} has an unexpected value ${suffix}.
           ~ Expected "${type}" node id array or ${topLevelOps} operator
           ~ expression.` ] :
   !isValidNodeIdList(schema, type, exp) ?
     [ strip`${prefix} has an invalid array value ${suffix}.
            ~ Expected "${type}" node id array or ${topLevelOps} operator
            ~ expression.` ] :
     [ ];
}

function validateObjectListUpdate(schema, type, exp, path, options) {
  const { prefix, suffix } = options;
  const isType = schema[type] && schema[type].kind === 'type';
  const topLevelOps =
    [ 'insert', 'delete', 'pop', 'clear' ].map(o => `"${o}"`).join(', ');
  const allowedInsertOps = isType ?
    [ 'insert', 'at', 'ascending', 'descending', 'keepFirst', 'keepLast' ] :
    [ 'insert', 'at', 'keepFirst', 'keepLast' ]; // union, interface
  const atMostOneOpList = isType ?
    [ 'at', 'ascending', 'descending' ] :
    [ 'at' ];
  const scalarFields = isType ?
    schema[type].fields.filter(f => f.isScalar).map(f => f.name) :
    [ ];

  return hasOp('insert', exp) ? [
    ...allowedOps(exp, allowedInsertOps, path, options),
    ...atMostOneOp(exp, atMostOneOpList, path, options),
    ...typeof exp.insert !== 'object' ?
       [ strip`${prefix} has an "insert" operator with invalid value ${suffix}.
              ~ Value passed to "insert" operator must be "${type}" object or
              ~ array of objects.` ] :
       Array.isArray(exp.insert) ?
         exp.insert.reduce(
           (acc, elem, ix) => acc.concat(
             objectValidator(
               schema,
               type,
               elem,
               `${path}.insert[${ix}]`,
               options)),
           [ ]) :
       objectValidator(schema, type, exp.insert, path, options),
    ...scalarOp(schema, 'at', 'Int', exp, options),
    ...isType ? [
      ...scalarOpVal(schema, 'ascending', 'String', scalarFields, exp, options),
      ...scalarOpVal(schema, 'descending', 'String', scalarFields, exp, options)
    ] : [ ],
    ...scalarOp(schema, 'keepFirst', 'Int', exp, options),
    ...scalarOp(schema, 'keepLast', 'Int', exp, options) ] :
  hasOp('delete', exp) ? [
    ...allowedOps(exp, [ 'delete' ], path, options),
    ...Array.isArray(exp.delete) ?
        exp.delete.reduce(
          (acc, elem, ix) => acc.concat(
            objectValidator(
              schema,
              type,
              elem,
              `${path}.delete[${ix}]`,
              options)),
          [ ]) :
        validateObjectFilter(
          schema,
          type,
          exp.delete,
          `${path}.delete`,
          options) ] :
  hasOp('pop', exp) ? [
    ...allowedOps(exp, [ 'pop' ], path, options),
    ...typeof exp.pop !== 'string' ||
       exp.pop.toLowerCase() !== 'first' &&
       exp.pop.toLowerCase() !== 'last' ?
      [ strip`${prefix} has an invalid "pop" operator ${suffix}. Value
             ~ passed to "pop" operator must be a String that is either
             ~ "first" or "last".` ] :
      [ ] ] :
  hasOp('clear', exp) ? [
    ...allowedOps(exp, [ 'clear' ], path, options),
    ...scalarOp(schema, 'clear', 'Boolean', exp, options) ] :
  !Array.isArray(exp) ?
    [ strip`${prefix} has an unexpected value ${suffix}.
           ~ Expected "${type}" object array or ${topLevelOps} operator
           ~ expression.` ] :
  exp.reduce(
    (acc, elem, ix) => acc.concat(
      objectValidator(schema, type, elem, `${path}[${ix}]`, options)),
    [ ]);
}
