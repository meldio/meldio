/* @flow */

import type { Name } from '../language/ast';
import { NAME } from '../language/kinds';

export function makeName(name: string): Name {
  return {
    kind: NAME,
    value: name
  };
}
