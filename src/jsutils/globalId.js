/* @flow */
import invariant from './invariant';
import { generatePushId } from './generatePushId';

/* eslint quote-props:0 */
const ENCODING_MAP =
  { '0': 'q', '1': 'r', '2': 's', '3': 't', '4': 'u', '5': 'v', '6': 'w',
    '7': 'x', '8': 'y', '9': 'z', _: '0',
    a: '1', b: '2', c: '3', d: '4', e: '5', f: '6', g: '7',
    h: '8', i: '9', j: 'A', k: 'B', l: 'C', m: 'D', n: 'E', o: 'F', p: 'G',
    q: 'H', r: 'I', s: 'J', t: 'K', u: 'L', v: 'M', w: 'N', x: 'O', y: 'P',
    z: 'Q', A: 'R', B: 'S', C: 'T', D: 'U', E: 'V', F: 'W', G: 'X', H: 'Y',
    I: 'Z', J: '_', K: 'a', L: 'b', M: 'c', N: 'd', O: 'e', P: 'f', Q: 'g',
    R: 'h', S: 'i', T: 'j', U: 'k', V: 'l', W: 'm', X: 'n', Y: 'o', Z: 'p' };

const DECODING_MAP =
  { '0': '_', '1': 'a', '2': 'b', '3': 'c', '4': 'd', '5': 'e', '6': 'f',
    '7': 'g', '8': 'h', '9': 'i',
    q: '0', r: '1', s: '2', t: '3', u: '4', v: '5', w: '6', x: '7',
    y: '8', z: '9', A: 'j', B: 'k', C: 'l', D: 'm', E: 'n', F: 'o', G: 'p',
    H: 'q', I: 'r', J: 's', K: 't', L: 'u', M: 'v', N: 'w', O: 'x', P: 'y',
    Q: 'z', R: 'A', S: 'B', T: 'C', U: 'D', V: 'E', W: 'F', X: 'G', Y: 'H',
    Z: 'I', _: 'J', a: 'K', b: 'L', c: 'M', d: 'N', e: 'O', f: 'P', g: 'Q',
    h: 'R', i: 'S', j: 'T', k: 'U', l: 'V', m: 'W', n: 'X', o: 'Y', p: 'Z' };

export function encode(type: string): string {
  return type.split('')
    .map(char => ENCODING_MAP[char])
    .join('');
}

export function decode(encoded: string): string {
  return encoded.split('')
    .map(char => DECODING_MAP[char])
    .join('');
}

function toGlobalId(type: string, pushId: string): string {
  return pushId + '-' + encode(type);
}

type ResolvedGlobalId = {
  type: string,
  pushId: string
}

function fromGlobalId(globalId: string): ResolvedGlobalId {
  invariant(isGlobalId(globalId), 'Invalid globalId.');
  return {
    type: decode(globalId.substring(21)),
    pushId: globalId.substring(0, 20)
  };
}

export function newGlobalId(type: string): string {
  return toGlobalId(type, generatePushId());
}

export function typeFromGlobalId(globalId: string): string {
  return fromGlobalId(globalId).type;
}

export function isGlobalId(globalId?: ?string): boolean {
  return globalId && typeof globalId === 'string' ?
    globalId.match(/^[A-Za-z0-9-_]{20}-[A-Za-z0-9_]+$/) !== null :
    false;
}
