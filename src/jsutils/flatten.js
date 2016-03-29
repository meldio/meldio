/* @flow */

export type NestedArray<T> = Array<T|NestedArray<T>>

export default function flatten<T>(xs: NestedArray<T>): Array<T> {
  let result = [ ];
  for (let i = 0; i < xs.length; i++) {
    if (Array.isArray(xs[i])) {
      result = result.concat(flatten(xs[i]));
    } else {
      result.push(xs[i]);
    }
  }
  return result;
}
