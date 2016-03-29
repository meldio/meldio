import rimraf from 'rimraf';

export function clearBuild(directory) {
  return new Promise( (resolve, reject) => {
    rimraf(directory, error => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });

}
