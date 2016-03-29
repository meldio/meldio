import bcrypt from 'bcrypt';

async function makeSalt(strength) {
  return new Promise( (resolve, reject) => {
    bcrypt.genSalt(strength, (err, salt) => {
      // istanbul ignore if
      if (err) {
        reject(err);
      } else {
        resolve(salt);
      }
    });
  });
}

async function makeHash(password, salt) {
  return new Promise( (resolve, reject) => {
    bcrypt.hash(password, salt, (err, hash) => {
      // istanbul ignore if
      if (err) {
        reject(err);
      } else {
        resolve(hash);
      }
    });
  });
}


export async function hashPassword(password, strength) {
  const salt = await makeSalt(strength);
  return makeHash(password, salt);
}

export async function isPasswordValid(clearText, hash) {
  return new Promise( (resolve, reject) => {
    bcrypt.compare(clearText, hash, (err, res) => {
      // istanbul ignore if
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
}
