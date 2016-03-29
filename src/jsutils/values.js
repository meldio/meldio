/* @flow */

/**
 * Turns a JS object into a list of its values. Same as Object.values in ES7,
 * currently unsupported by Flow.
 */

export default function values<T>(
  object: {[key: any]: T}
): Array<T> {
  return Object.keys(object).map(key => object[key]);
}
