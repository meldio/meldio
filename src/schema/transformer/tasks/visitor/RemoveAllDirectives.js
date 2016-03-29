/* @flow */

import type { VisitorMap } from '../../../analyzer';

export function RemoveAllDirectives(): VisitorMap {
  return {
    Directive: () => null // deletes the AST node
  };
}
