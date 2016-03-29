import glob from 'glob';

export function listFiles(globPattern, ignorePattern) {
  return new Promise( (resolve, reject) => {
    glob(globPattern, { ignore: ignorePattern }, (error, files) => {
      if (error) {
        reject(error);
      } else {
        resolve(files);
      }
    });
  });
}
