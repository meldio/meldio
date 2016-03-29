/* @flow */
/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

import type {
 ConnectionCursor,
} from '../types';

import { base64, unbase64 } from '../../../jsutils/base64';

const PREFIX = 'connection:';

/**
 * Creates the cursor string from an offset.
 */
export function offsetToCursor(offset: number): ConnectionCursor {
  return base64(PREFIX + offset);
}

/**
 * Rederives the offset from the cursor string.
 */
export function cursorToOffset(cursor: ConnectionCursor): number {
  return parseInt(unbase64(cursor).substring(PREFIX.length), 10);
}


/**
 * Given an optional cursor and a default offset, returns the offset
 * to use; if the cursor contains a valid offset, that will be used,
 * otherwise it will be the default.
 */
export function getOffsetWithDefault(
  cursor?: ?ConnectionCursor,
  length: number,
  defaultOffset: number
): number {
  if (!cursor) {
    return defaultOffset;
  }
  const offset = cursorToOffset(cursor);
  return isNaN(offset) || offset < 0 || offset >= length ?
    defaultOffset :
    offset;
}
