import fs from 'fs';

export function writeFile(fileName, data) {
  return new Promise( (resolve, reject) => {
    fs.writeFile(fileName, data, err => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}
