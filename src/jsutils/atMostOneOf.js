/* @flow */

export default function atMostOneOf(...args: any): boolean {
  return args
    .filter(a => Boolean(a))
    .length <= 1;
}
