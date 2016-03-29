import { transformFile } from 'babel-core';

export function transpile(fileName) {
  const options = {
    filename: fileName,
  };
  return new Promise((resolve, reject) =>
    transformFile(fileName, options, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result.code);
      }
    }));
}
