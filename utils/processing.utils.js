/* eslint-disable no-plusplus */
/* eslint-disable no-restricted-syntax */
/* eslint-disable camelcase */
const { exec, execFile } = require('child_process');
const fs = require('fs');
const requestPromise = require('request-promise');

/**
 * Редактирование объекта для последующего использования при построении графиков
 * @param {Object} params - объект с параметрами запроса
 * @param {string[]} params.apps - массив с названиями приложений
 * @param {string[]} params.links - массив с ссылками
 * @param {boolean} params.json - изначальный объект для форматирования
 */
exports.editJson = async ({ json, apps, links }) => {
  const appsInfo = await requestPromise('http://192.241.152.146:3001/api/apps', { json: true });
  const result = {
    max_time: 0,
    apps: [],
    links: [],
  };
  for (const app of apps) {
    const appObject = {};
    appObject.name = app;
    let periodCounter = 0;
    for (const key of Object.keys(json)) {
      if (json[key].apps && json[key].apps[app]) ++periodCounter;
    }
    const minutes_spent = Math.floor(periodCounter / 6);
    appObject.minutes_spent = minutes_spent;
    if (minutes_spent > result.max_time) result.max_time = minutes_spent;
    const [appInfo] = appsInfo.apps.filter((elem) => elem.process_name === app);
    if (appInfo) {
      appObject.image_link = appInfo.image_link;
    }
    result.apps.push(appObject);
  }
  for (const link of links) {
    const linkObject = {};
    linkObject.name = link;
    let periodCounter = 0;
    for (const key of Object.keys(json)) {
      if (json[key].tabs && json[key].tabs[link]) ++periodCounter;
    }
    const [appInfo] = appsInfo.links.filter((elem) => elem.name === link);
    if (appInfo) {
      linkObject.image_link = appInfo.image_link;
    }
    const minutes_spent = Math.floor(periodCounter / 6);
    linkObject.minutes_spent = minutes_spent;
    if (minutes_spent > result.max_time) result.max_time = minutes_spent;
    result.links.push(linkObject);
  }
  return result;
};
/**
 * Асинхронная проверка существования файла
 * @param {string} file - файл, который необходимо проверить на наличие
 */
exports.existsAsync = async (file) => fs.promises.access(file, fs.constants.F_OK)
  .then(() => true)
  .catch(() => false);
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
