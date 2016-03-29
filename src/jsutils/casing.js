/* TODO: remove lodash dependency */

import { capitalize, snakeCase, camelCase as ldCamelCase } from 'lodash';

export function camelCase(str: string): string {
  return ldCamelCase(str);
}

export function sentenceCase(str: string): string {
  return capitalize(camelCase(str));
}

export function capitalCase(str: string): string {
  return snakeCase(str).toUpperCase();
}
