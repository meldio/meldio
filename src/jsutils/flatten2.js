/* @flow */

/* flattens one level deep - defined so purely due to some flow weirdness */

export type NestedArray<T> = Array<Array<T> | T>;

export default function flatten<T>(xs: NestedArray<T>): Array<T> {
  let result = [ ];
  for (let i = 0; i < xs.length; i++) {
    if (Array.isArray(xs[i])) {
      result = result.concat(xs[i]);
    } else {
      result.push(xs[i]);
    }
  }
  return result;
}
