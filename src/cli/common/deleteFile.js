import fs from 'fs';

export function deleteFile(fileName) {
  return new Promise( (resolve, reject) => {
    fs.unlink(fileName, err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}
