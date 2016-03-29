import crypto from 'crypto';

export function randomBuffer(lengthInBytes) {
  return new Promise( (resolve, reject) =>
    crypto.randomBytes(lengthInBytes, (error, buffer) => {
      // istanbul ignore if
      if (error) {
        reject(error);
      } else {
        resolve(buffer);
      }
    }));
}

export async function randomBase64(lengthInBytes) {
  const buffer = await randomBuffer(lengthInBytes);
  return buffer.toString('base64');
}

function bufferToPad(buffer, pad) {
  const result = [ ];

  // this basically throws away ~2 bits of randomness per each char of
  // length, but that's fine.
  for (let i = 0; i < buffer.length; i++) {
    result.push( pad[buffer[i] % pad.length] );
  }

  return result.join('');
}

function bufferToBase62(buffer) {
  const pad = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return bufferToPad(buffer, pad);
}

function bufferToBase10(buffer) {
  const pad = '0123456789';
  return bufferToPad(buffer, pad);
}

export async function randomBase62(lengthInChars) {
  const buffer = await randomBuffer(lengthInChars);
  return bufferToBase62(buffer);
}

export async function randomBase10(lengthInChars) {
  const buffer = await randomBuffer(lengthInChars);
  return bufferToBase10(buffer);
}
