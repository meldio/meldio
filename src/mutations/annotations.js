import invariant from '../jsutils/invariant';
import isNullish from '../jsutils/isNullish';

const hasExactlyOne = list => list && list.length === 1;

export function addTypeAnnotations(context, typeName, object) {
  invariant(context, 'must pass context to addTypeAnnotations.');
  invariant(typeName, 'must pass typeName to addTypeAnnotations.');
  invariant(object, 'must pass object to addTypeAnnotations.');

  const type = context.schema[typeName];
  if (!type) { return object; }

  let annotatedObject;
  let actualType;
  if (type.kind === 'type' && !type.implementsNode && !object._type) {
    annotatedObject = { _type: type.name, ...object };
    actualType = type;
  } else if (type.kind === 'interface' &&
             !type.everyTypeImplementsNode &&
             hasExactlyOne(type.implementations) &&
             !object._type) {
    annotatedObject = { _type: type.implementations[0], ...object };
    actualType = context.schema[type.implementations[0]];
  } else if (type.kind === 'union' &&
            !type.everyTypeImplementsNode &&
            hasExactlyOne(type.typeNames) &&
            !object._type) {
    annotatedObject = { _type: type.typeNames[0], ...object };
    actualType = context.schema[type.typeNames[0]];
  } else {
    annotatedObject = object;
    actualType = type;
  }

  if (actualType.fields) {
    return actualType.fields
      .filter(field =>
        (field.isObjectList || field.isObject) &&
        !isNullish(annotatedObject[field.name]))
      .reduce(
        (acc, field) => ({
          ...acc,
          [field.name]:
            field.isObjectList ?
              acc[field.name]
                .map(element =>
                  addTypeAnnotations(context, field.type, element)) :
              addTypeAnnotations(context, field.type, acc[field.name])
        }), annotatedObject);
  }

  return annotatedObject;
}

export function addTypeAnnotationsToUpdateExp(context, typeName, expression) {
  invariant(context, 'must pass context to addTypeAnnotationsToUpdateExp.');
  invariant(typeName, 'must pass typeName to addTypeAnnotationsToUpdateExp.');
  invariant(expression, 'must pass object to addTypeAnnotationsToUpdateExp.');
  const type = context.schema[typeName];
  if (!type) { return expression; }

  let annotatedExpression;
  let actualType;
  if (type.kind === 'type' && !type.implementsNode && !expression._type) {
    annotatedExpression = { _type: type.name, ...expression };
    actualType = type;
  } else if (type.kind === 'interface' &&
             !type.everyTypeImplementsNode &&
             hasExactlyOne(type.implementations) &&
             !expression._type) {
    annotatedExpression = { _type: type.implementations[0], ...expression };
    actualType = context.schema[type.implementations[0]];
  } else if (type.kind === 'union' &&
            !type.everyTypeImplementsNode &&
            hasExactlyOne(type.typeNames) &&
            !expression._type) {
    annotatedExpression = { _type: type.typeNames[0], ...expression };
    actualType = context.schema[type.typeNames[0]];
  } else {
    annotatedExpression = expression;
    actualType = type;
  }

  if (actualType.fields) {
    return actualType.fields
      .filter(field =>
        (field.isObjectList || field.isObject) &&
        !isNullish(expression[field.name]))
      .reduce(
        (acc, field) => ({
          ...acc,
          [field.name]:
            field.isObjectList && Array.isArray(acc[field.name]) ?
              acc[field.name].map(element =>
                addTypeAnnotations(context, field.type, element)) :
            field.isObjectList && Array.isArray(acc[field.name].insert) ?
              {
                ...acc[field.name],
                insert:
                  acc[field.name].insert.map(element =>
                    addTypeAnnotations(context, field.type, element))
              } :
            field.isObjectList && !isNullish(acc[field.name].insert) ?
              {
                ...acc[field.name],
                insert:
                  addTypeAnnotations(
                    context,
                    field.type,
                    acc[field.name].insert)
              } :
            field.isObjectList && Array.isArray(acc[field.name].delete) ?
              {
                ...acc[field.name],
                delete:
                  acc[field.name].delete.map(element =>
                    addTypeAnnotations(context, field.type, element))
              } :
            // field.isObject ?
            addTypeAnnotationsToUpdateExp(context, field.type, acc[field.name])
        }), annotatedExpression);
  }

  return annotatedExpression;
}
