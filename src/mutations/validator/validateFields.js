import isNullish from '../../jsutils/isNullish';
import flatten from '../../jsutils/flatten2';

export function validateFields(schema, fields, object, path, options) {
  const {
    noConnections,
    enforceRequired,
    noUndefinedFields,
    prefix = '',
    additionalAllowedFields = [ ],
    fieldValidator = () => true,
  } = options || { };
  const isConnection = f =>
    f.isNodeConnection || f.isObjectConnection || f.isScalarConnection;
  const withPath = fieldName => path ? path + '.' + fieldName : fieldName;
  const fieldNames = new Set(
    fields
      .map(f => f.name)
      .concat(additionalAllowedFields));

  return [
    ...noConnections ?
      fields
        .filter(f => !isNullish(object[f.name]) && isConnection(f) )
        .map(f =>
          `${prefix} cannot have a connection field "${withPath(f.name)}".`) :
      [ ],

    ...enforceRequired ?
      fields
        .filter(f => isNullish(object[f.name]) && f.isRequired)
        .map(f =>
          `${prefix} must have a required field "${withPath(f.name)}".`) :
      [ ],

    ...noUndefinedFields ?
      Object.keys(object)
        .filter(key => !fieldNames.has(key))
        .map(key =>
          `${prefix} cannot have an undefined field "${withPath(key)}".`) :
      [ ],

    ...flatten(
      fields
        .filter(f =>
          !isNullish(object[f.name]) && (!isConnection(f) || !noConnections))
        .map(f =>
          fieldValidator(schema, f, object[f.name], path, options))
        .filter(res => res && res.length) ),
  ];
}
