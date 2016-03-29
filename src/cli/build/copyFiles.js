import ProgressBar from 'progress';
import cp from 'fs-cp';

import { resolve as resolvePath } from 'path';

export async function copyFiles(jsonFiles, options, config) {
  const { build: buildDirectory } = config;
  const rootDirectory = config.root || '';

  const progress = new ProgressBar(' copying json files [:bar] :percent :etas',
    {
      width: 20,
      total: jsonFiles.length + 1,
      clear: true
    });
  progress.tick(1);

  await Promise.all(
    jsonFiles.map(async fileName => {
      const filePath = resolvePath(fileName);
      const targetFilePath = fileName.startsWith(rootDirectory) ?
        resolvePath(rootDirectory, buildDirectory,
                    '.' + fileName.substr(rootDirectory.length)) :
        resolvePath(rootDirectory, buildDirectory, fileName);
      await cp(filePath, targetFilePath);
      progress.tick(1);
    }));

  return true;
}
