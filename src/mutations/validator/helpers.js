import strip from '../../jsutils/strip';
import isNullish from '../../jsutils/isNullish';
import { typeFromGlobalId, isGlobalId } from '../../jsutils/globalId';

export function isValidNodeId(schema, type, id) {
  return Boolean(
    isNullish(id) ||
    isGlobalId(id) &&
    schema[type] &&
    (
      schema[type].kind === 'type' &&
        typeFromGlobalId(id) === type ||
      schema[type].kind === 'interface' &&
        schema[type].implementations.includes(typeFromGlobalId(id)) ||
      schema[type].kind === 'union' &&
        schema[type].typeNames.includes(typeFromGlobalId(id))
    )
  );
}

export function isValidNodeIdList(schema, type, list) {
  return Array.isArray(list) &&
    list.reduce((acc, elem) => acc && isValidNodeId(schema, type, elem), true);
}

export function isValidScalar(schema, type, value) {
  return type === 'String' ?
           typeof value === 'string' :
         type === 'Int' || type === 'Float' ?
           typeof value === 'number' :
         type === 'Boolean' ?
           value === true || value === false :
         type === 'ID' ?
           typeof value === 'string' :
         schema[type] && schema[type].kind === 'enum' ?
           schema[type].values.includes(value) :
         false;
}

export function isValidScalarList(schema, type, list) {
  return Array.isArray(list) &&
    list.reduce((acc, elem) => acc && isValidScalar(schema, type, elem), true);
}

export function hasOp(op, expression) {
  return typeof expression === 'object' &&
    !Array.isArray(expression) &&
    !isNullish(expression[op]);
}

export function allowedOps(expression, allowed, path, options) {
  const { prefix, suffix } = options;
  const allowedSet = new Set(allowed);
  const allowedStr = allowed.map(o => `"${o}"`).join(', ');

  return typeof expression !== 'object' ?
      [ strip`${prefix} has a scalar value where object is expected ${suffix}.
             ~ Only object expressions are allowed in this context.` ] :
    Array.isArray(expression) ?
      [ strip`${prefix} has an array where object is expected ${suffix}.
             ~ Only object expressions are allowed in this context.` ] :
    Object.keys(expression)
      .filter(key => !allowedSet.has(key))
      .map(key =>
        strip`${prefix} has an invalid "${key}" operator ${suffix}.
             ~ Allowed operators are: ${allowedStr}.`);
}

export function typeOp(schema, allowedTypes, filter, path, {prefix}) {
  const exp = filter.type;
  if (isNullish(exp)) { return [ ]; }

  const allowed = new Set(allowedTypes);
  const allowedStr = allowedTypes.map(t => `"${t}"`).join(', ');
  const suffix = `within "${path}" subexpression`;
  const options = { prefix, suffix };

  if (typeof exp !== 'object' || Array.isArray(exp)) {
    return !isValidScalar(schema, 'String', exp) &&
      !isValidScalarList(schema, 'String', exp) ?
        [ strip`${prefix} has an invalid value ${suffix}.
               ~ Expected "String" array or scalar of: ${allowedStr}.` ] :
      ![].concat(exp).every(t => allowed.has(t)) ?
        [ strip`${prefix} has invalid type name ${suffix}.
               ~ Expected "String" array or scalar of: ${allowedStr}.` ] :
        [ ];
  }
  return [
    ...allowedOps(exp, [ 'eq', 'ne' ], path, options),
    ...!isNullish(exp.eq) && !allowed.has(exp.eq) &&
      (!Array.isArray(exp.eq) || !exp.eq.every(t => allowed.has(t))) ?
      [ strip`${prefix} has invalid "eq" operator value ${suffix}.
             ~ Expected "String" array or scalar of: ${allowedStr}.` ] :
      [ ],
    ...!isNullish(exp.ne) && !allowed.has(exp.ne) &&
      (!Array.isArray(exp.ne) || !exp.ne.every(t => allowed.has(t))) ?
      [ strip`${prefix} has invalid "ne" operator value ${suffix}.
             ~ Expected "String" array or scalar of: ${allowedStr}.` ] :
      [ ],
  ];
}

export function scalarListOp(schema, op, type, exp, options) {
  if (typeof exp !== 'object' || Array.isArray(exp)) { return [ ]; }

  const { prefix, suffix } = options;
  return !isNullish(exp[op]) &&
    !isValidScalar(schema, type, exp[op]) &&
    !isValidScalarList(schema, type, exp[op]) ?
      [ strip`${prefix} has "${op}" operator with invalid value ${suffix}. Value
            ~ passed to "${op}" operator must be "${type}" scalar or array.` ] :
      [ ];
}

export function nodeIdListOp(schema, op, type, exp, options) {
  if (typeof exp !== 'object' || Array.isArray(exp)) { return [ ]; }

  const { prefix, suffix } = options;
  return !isNullish(exp[op]) &&
    !isValidNodeId(schema, type, exp[op]) &&
    !isValidNodeIdList(schema, type, exp[op]) ?
      [ strip`${prefix} has "${op}" operator with invalid value ${suffix}. Value
             ~ passed to "${op}" operator must be "${type}" node id or array
             ~ of node ids.` ] :
      [ ];
}


export function scalarOp(schema, op, type, exp, options) {
  if (typeof exp !== 'object' || Array.isArray(exp)) { return [ ]; }

  const { prefix, suffix } = options;
  return !isNullish(exp[op]) && !isValidScalar(schema, type, exp[op]) ?
    [ strip`${prefix} has "${op}" operator with invalid value ${suffix}. Value
           ~ passed to "${op}" operator must be "${type}" scalar.` ] :
    [ ];
}

export function scalarOpVal(schema, op, type, values, exp, options) {
  if (typeof exp !== 'object' || Array.isArray(exp)) { return [ ]; }
  const valuesStr = values.map(v => `${String(v)}`).join(', ');

  const { prefix, suffix } = options;
  return !isNullish(exp[op]) && !isValidScalar(schema, type, exp[op]) ?
    [ strip`${prefix} has "${op}" operator with invalid value ${suffix}. Value
           ~ passed to "${op}" operator must be "${type}" scalar with one
           ~ of the following values: ${valuesStr}.` ] :
  !isNullish(exp[op]) && !values.includes(exp[op]) ?
    [ strip`${prefix} has "${op}" operator with invalid value ${suffix}. Value
           ~ passed to "${op}" operator must be "${type}" scalar with one
           ~ of the following values: ${valuesStr}.` ] :
    [ ];
}

export function atMostOneOp(exp, ops, path, options) {
  if (typeof exp !== 'object' || Array.isArray(exp)) { return [ ]; }

  const opsString = ops.map(o => `"${o}"`).join(', ');
  const { prefix, suffix } = options;
  const hasOneOrLess = ops.filter(op => !isNullish(exp[op])).length <= 1;

  return !hasOneOrLess ?
    [ strip`${prefix} has an invalid operator expression ${suffix}.
           ~ Expected at most one of the following operators: ${opsString}.` ] :
    [ ];
}
