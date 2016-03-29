/* @flow */

import type { VisitorMap } from '../../../analyzer';

export function RemoveOrderDefs(): VisitorMap {
  return {
    OrderDefinition: () => null // deletes OrderDefinition ast node
  };
}
