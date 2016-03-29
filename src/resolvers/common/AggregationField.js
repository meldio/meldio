
export function AggregationField(parent, args, info) {
  const { fieldASTs, fieldName } = info;
  const alias = fieldASTs[0].alias ? fieldASTs[0].alias.value : null;
  const lookupKey = alias || fieldName;
  return parent[lookupKey];
}
