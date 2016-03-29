import mkdirp from 'mkdirp';
import path from 'path';

export function mkdir(fileName, isDirectory) {
  const directory = isDirectory ?
    fileName :
    path.parse(fileName).dir;

  return new Promise((resolve, reject) =>
    mkdirp(directory, error => {
      if (error) {
        reject(error);
      } else {
        resolve(directory);
      }
    }));
}
