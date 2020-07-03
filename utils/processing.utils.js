/* eslint-disable camelcase */
const { exec, execFile } = require('child_process');
const fs = require('fs');

/**
 * Асинхронная проверка существования файла
 * @param {string} file - файл, который необходимо проверить на наличие
 */
exports.existsAsync = async (file) => {
  return fs.promises.access(file, fs.constants.F_OK)
    .then(() => true)
    .catch(() => false);
};
/**
 * Промис, обрабатывающий exec
 */
exports.execAsync = (path) => new Promise((resolve, reject) => {
  exec(path, (error, stdout, stderr) => {
    if (error) {
      return reject(error.message);
    }
    if (stderr) {
      return reject(stderr);
    }
    return resolve(stdout);
  });
});
/**
 * Промис, обрабатывающий execFile
 */
exports.execFileAsync = (path, args = []) => new Promise((resolve, reject) => {
  execFile(path, args, (err, stdout, stderr) => {
    if (err) return reject(err);
    if (stderr) return reject(stderr);
    return resolve(stdout.toString());
  });
});
