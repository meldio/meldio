import fs from 'fs';
import { writeFile } from './writeFile';

export async function createFileIfMissing(filePath, content) {
  try {
    await stat(filePath);
  } catch (e) {
    if (e.code === 'ENOENT') {
      return writeFile(filePath, content);
    }
  }
  return null;
}

const stat = filePath =>
  new Promise( (resolve, reject) =>
    fs.stat(filePath, (error, stats) => {
      if (error) {
        reject(error);
      } else {
        resolve(stats);
      }
    }) );
