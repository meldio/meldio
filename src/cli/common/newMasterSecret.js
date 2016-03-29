import { randomBase64 } from '../../jsutils/random';

const SHA512keyLengthInBytes = 64;

export async function newMasterSecret() {
  return randomBase64(SHA512keyLengthInBytes);
}
