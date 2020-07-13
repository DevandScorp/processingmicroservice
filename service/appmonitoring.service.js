/* eslint-disable no-empty */
/* eslint-disable object-curly-newline */
// @ts-nocheck
/* eslint-disable no-throw-literal */
/* eslint-disable camelcase */
/* eslint-disable no-return-await */
/* eslint-disable no-continue */
/* eslint-disable max-len */
/* eslint-disable no-plusplus */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const moment = require('moment');
const readline = require('readline');
const ObjectsToCsv = require('objects-to-csv');
const { execAsync, execFileAsync, existsAsync } = require('../utils/processing.utils');
/**
 * Сервис для работы со скриптом, получающим текущее используемое приложение и текущую ссылку при использовании браузера
 */
class AppMonitoringService {
  constructor() {
    this.appHandlerInterval = null;
    this.apps = [];
    this.browserTabs = [];
    this.currentStatus = null;
    this.currentStartTime = null;
    this.statusTimeList = [];
  }

  /**
   * Установка статуса пользователя: активный/неактивный режим
   * @param {object} params - объект с данными запроса
   * @param {string} params.active - статус пользователя
   */
  setStatus({ active }) {
    if (this.currentStatus === null) {
      this.currentStatus = active;
      this.currentStartTime = moment().format('YYYY-MM-DD HH:mm:ss');
    }
    if (active !== this.currentStatus) {
      this.statusTimeList.push({
        date_start: this.currentStartTime,
        date_end: moment().format('YYYY-MM-DD HH:mm:ss'),
        active: this.currentStatus,
      });
      this.currentStatus = active;
      this.currentStartTime = moment().format('YYYY-MM-DD HH:mm:ss');
    }
  }

  /**
   * @param {object} params - объект с данными запроса
   * @param {string} params.date_from - дата с (с указанием времени вплоть до минут)
   * @param {string} params.date_to - дата по (с указанием времени вплоть до мин
   * @param {string[]} params.apps - массив с названиями приложений
   * @param {string[]} params.links - массив с ссылками
   * @param {string} params.model_name - наименование модели
   */
  async predict({ date_from, date_to, apps, links, model_name, python }) {
    const dateFromMoment = moment(date_from, 'YYYY-MM-DD HH:mm:ss');
    const dateToMoment = moment(date_to, 'YYYY-MM-DD HH:mm:ss');
    if (!dateFromMoment.isValid() || !dateToMoment.isValid()) throw 'Были переданы некорректные даты';
    if (dateFromMoment.isAfter(dateToMoment)) throw 'Дата с идет позже, чем дата по';
    const dataset = await this.generateJson({ train: false, date_from, date_to });
    const predictions = [];
    for (const key of Object.keys(dataset)) {
      const predictionElement = [];
      let appIndex = 0;
      for (const app of apps) {
        predictionElement[appIndex] = dataset[key].apps ? dataset[key].apps[app] || 0 : 0;
        ++appIndex;
      }
      let linkIndex = 0;
      for (const link of links) {
        predictionElement[appIndex + linkIndex] = dataset[key].tabs ? dataset[key].tabs[link] || 0 : 0;
        ++linkIndex;
      }
      predictionElement[appIndex + linkIndex] = dataset[key].mouseActivityCounter || 0;
      predictionElement[appIndex + linkIndex + 1] = dataset[key].keyboardActivityCounter || 0;
      predictions.push(predictionElement);
    }
    let result;
    if (python) {
      result = await execAsync(`python ./decisionSearchTree/predict.py ${JSON.stringify(predictions)} ${model_name}`);
    } else {
      result = await execFileAsync('./decisionSearchTree/dist/predict.exe', [`${JSON.stringify(predictions)}`, model_name]);
    }
    return JSON.parse(result.trim());
  }

  /**
   * Генерация датасета
   * @param {object} params - объект с данными запроса
   * @param {string[]} params.apps - массив с названиями приложений
   * @param {string[]} params.links - массив с ссылками
   */
  async generateDataset({ apps, links }) {
    const csvArray = [];
    const statusTimeListString = await fs.promises.readFile(path.join('files', 'train', 'status-time-list.json'), 'utf-8');
    this.statusTimeList = JSON.parse(statusTimeListString);
    let dataset = await fs.promises.readFile('./files/train/applicationActivity.json', 'utf-8');
    dataset = JSON.parse(dataset);
    for (const key of Object.keys(dataset)) {
      const csvElement = {};
      for (const app of apps) {
        csvElement[app] = dataset[key].apps ? dataset[key].apps[app] || 0 : 0;
      }
      for (const link of links) {
        csvElement[link] = dataset[key].tabs ? dataset[key].tabs[link] || 0 : 0;
      }
      csvElement.mouse = dataset[key].mouseActivityCounter || 0;
      csvElement.keyboard = dataset[key].keyboardActivityCounter || 0;
      const [timeGapElement] = this.statusTimeList.filter((elem) => moment(key, 'YYYY-MM-DD HH:mm:ss').isSameOrAfter(
        moment(elem.date_start, 'YYYY-MM-DD HH:mm:ss'),
      )
      && moment(key, 'YYYY-MM-DD HH:mm:ss').isSameOrBefore(
        moment(elem.date_end, 'YYYY-MM-DD HH:mm:ss'),
      ));
      if (!timeGapElement) continue;
      csvElement.label = +timeGapElement.active;
      csvArray.push(csvElement);
    }
    const csv = new ObjectsToCsv(csvArray);
    csv.toDisk('./files/train/dataset.csv', { append: false });
  }

  /**
   * Генерация json'a для датасета
   * @param {Object} params - объект с параметрами запроса
   * @param {boolean} params.train - идентификатор тренировки
   * @param {object} params.date_from - дата с для фильтрации по дате для использования модели
   * @param {object} params.date_to - дата по для фильтрации по дате для использования модели
   */
  async generateJson({ train, date_from = null, date_to = null }) {
    const applicationActivityStream = fs.createReadStream(
      `./files/${train ? 'train' : 'predict'}/results-active-program.txt`,
    );
    const applicationActivityReadLines = readline.createInterface({
      input: applicationActivityStream,
      crlfDelay: Infinity,
    });
    /**
     * Add application activity
     */
    const applicationUniqueDateSet = new Set();
    const applicationActivityResult = {};
    for await (const line of applicationActivityReadLines) {
      let [date, app] = line.split(',');
      app = app.trim();
      if (applicationUniqueDateSet.has(date)) continue;
      applicationUniqueDateSet.add(date);
      date = moment(date, 'YYYY-MM-DD HH:mm:ss');
      /**
       * Если идет получение данных для использования модели, то тогда пропускаем ненужные даты
       */
      if (date_from && date_to) {
        if (date.isBefore(date_from) || date.isAfter(date_to)) continue;
      }
      date = date.format('YYYY-MM-DD HH:mm:ss').replace(/[0-9]$/, '0');
      if (!applicationActivityResult[date]) applicationActivityResult[date] = {};
      if (!applicationActivityResult[date].apps) applicationActivityResult[date].apps = {};
      if (applicationActivityResult[date].apps[app] === undefined) applicationActivityResult[date].apps[app] = 0;
      applicationActivityResult[date].apps[app]++;
    }
    /**
     * Add keyboard activity
     */
    const keyboardActivityStream = fs.createReadStream(
      `./files/${train ? 'train' : 'predict'}/results-keyboard.txt`,
    );
    const keyboardActivityReadLines = readline.createInterface({
      input: keyboardActivityStream,
      crlfDelay: Infinity,
    });
    for await (const line of keyboardActivityReadLines) {
      const date = line.replace(/\.[0-9]+/, '').replace(/[0-9]$/, '0');
      if (applicationActivityResult[date]) {
        if (!applicationActivityResult[date].keyboardActivityCounter) applicationActivityResult[date].keyboardActivityCounter = 0;
        applicationActivityResult[date].keyboardActivityCounter++;
      }
    }
    /**
     * Add mouse activity
     */
    const mouseActivityStream = fs.createReadStream(
      `./files/${train ? 'train' : 'predict'}/results-mouse.txt`,
    );
    const mouseActivityReadLines = readline.createInterface({
      input: mouseActivityStream,
      crlfDelay: Infinity,
    });
    for await (const line of mouseActivityReadLines) {
      /**
       * Заменяем последнюю цифру на ноль, чтобы разбивать данные на промежутки по десять секунд для демонстрации
       */
      const date = line.replace(/\.[0-9]+/, '').replace(/[0-9]$/, '0');
      if (applicationActivityResult[date]) {
        if (!applicationActivityResult[date].mouseActivityCounter) applicationActivityResult[date].mouseActivityCounter = 0;
        applicationActivityResult[date].mouseActivityCounter++;
      }
    }
    /**
     * Add browser tabs activity
     */
    const browserTabsActivityStream = fs.createReadStream(
      `./files/${train ? 'train' : 'predict'}/results-active-tab.txt`,
    );
    const browserTabsActivityReadLines = readline.createInterface({
      input: browserTabsActivityStream,
      crlfDelay: Infinity,
    });
    /**
     * Set для того, чтобы не было множества вкладок за одну секунду
     */
    const browserTabsUniqueDateSet = new Set();
    for await (const line of browserTabsActivityReadLines) {
      let [date, tab] = line.split(',');
      tab = tab.trim();
      if (browserTabsUniqueDateSet.has(date)) continue;
      browserTabsUniqueDateSet.add(date);
      /**
       * Заменяем последнюю цифру на ноль, чтобы разбивать данные на промежутки по десять секунд для демонстрации
       */
      date = date.replace(/[0-9]$/, '0');
      if (!applicationActivityResult[date]) continue;
      if (!applicationActivityResult[date].tabs) applicationActivityResult[date].tabs = {};
      if (applicationActivityResult[date].tabs[tab] === undefined) applicationActivityResult[date].tabs[tab] = 0;
      applicationActivityResult[date].tabs[tab]++;
    }
    if (train) {
      await fs.promises.writeFile(
        './files/train/applicationActivity.json',
        JSON.stringify(applicationActivityResult),
      );
    }
    return applicationActivityResult;
  }

  /**
   * Тренировка и сохранение модели
   * @param {object} params - объект запроса
   * @param {string} params.model_name - наименование модели
   * @param {string[]} params.apps - массив с названиями приложений
   * @param {string[]} params.links - массив с ссылками
   * @param {boolean} params.python - идентификатор использования питоновского скрипта
   */
  async trainModel({ model_name, apps, links, python }) {
    if (python) {
      await execAsync(`python ./decisionSearchTree/train.py ${model_name}`);
    } else {
      await execFileAsync('./decisionSearchTree/dist/train.exe', [model_name]);
    }
  }

  /**
   * Остановка мониторинга приложений
   * @param {Object} params - объект с параметрами запроса
   * @param {boolean} params.train - идентификатор тренировки
   */
  async stopMonitoring({ train }) {
    if (train && this.active !== null) {
      this.statusTimeList.push({
        date_start: this.currentStartTime,
        date_end: moment().format('YYYY-MM-DD HH:mm:ss'),
        active: this.currentStatus,
      });
      await fs.promises.writeFile(path.join('files', 'train', 'status-time-list.json'), JSON.stringify(this.statusTimeList));
    }
    await this.stopEventsMonitoring(train);
    if (this.appHandlerInterval) {
      clearInterval(this.appHandlerInterval);
    }
  }

  /**
   * Запуск мониторинга приложений
   * @param {Object} params - объект с параметрами запроса
   * @param {string[]} params.apps - массив с названиями приложений
   * @param {string[]} params.links - массив с ссылками
   * @param {boolean} params.train - идентификатор тренировки
   */
  async startMonitoring({ apps, links, train }) {
    if (await existsAsync(path.join('files', 'train', 'status-time-list.json')) && train) {
      const statusTimeListString = await fs.promises.readFile(path.join('files', 'train', 'status-time-list.json'), 'utf-8');
      this.statusTimeList = JSON.parse(statusTimeListString);
    }
    await this.startEventsMonitoring(train);
    this.appHandlerInterval = setInterval(async () => {
      try {
        const stdout = await execAsync(
          `"${path.join(
            __dirname,
            '..',
            'getCurrentWindowScript',
            'ConsoleApp1.exe',
          )}"`,
        );
        const trimmedStdout = stdout.trim();
        if (apps.filter((app) => app === trimmedStdout).length) {
          this.apps.push(
            `${moment().format('YYYY-MM-DD HH:mm:ss')}, ${trimmedStdout}`,
          );
          if (stdout.trim() === 'chrome') await this.getCurrentBrowserLink({ links, train });
          if (this.apps.length >= 10) {
            for (const app of this.apps) {
              await fs.promises.appendFile(
                `./files/${train ? 'train' : 'predict'}/results-active-program.txt`,
                `${app}\n`,
              );
            }
            this.apps = [];
          }
        }
      } catch (err) {}
    }, 1000);
  }

  /**
   * Запуск мониторинга событий кликов мыши и клавиатуры
   * @param {boolean} train - идентификатор тренировки
   */
  async startEventsMonitoring(train) {
    spawn('powershell.exe', ['Start-Process', './eventslisteners/dist/keyboard-events.exe', '-WindowStyle', 'Hidden', '-ArgumentList', train ? 'train' : 'predict']);
    spawn('powershell.exe', ['Start-Process', './eventslisteners/dist/mouse-events.exe', '-WindowStyle', 'Hidden', '-ArgumentList', train ? 'train' : 'predict']);
  }

  /**
   * Остановка мониторинга событий кликов мыши и клавиатуры
   * @param {boolean} train - идентификатор тренировки
   */
  async stopEventsMonitoring(train) {
    await fs.promises.access(path.join('files', train ? 'train' : 'predict', 'current-keyboard-pid.txt'));
    await fs.promises.access(path.join('files', train ? 'train' : 'predict', 'current-mouse-pid.txt'));
    const keyboardEventsTaskPid = await fs.promises.readFile(
      path.join('files', train ? 'train' : 'predict', 'current-keyboard-pid.txt'),
      'utf-8',
    );
    if (keyboardEventsTaskPid) {
      await execAsync(`taskkill /F /PID ${keyboardEventsTaskPid}`);
    }
    const mouseEventsTaskPid = await fs.promises.readFile(
      path.join('files', train ? 'train' : 'predict', 'current-mouse-pid.txt'),
      'utf-8',
    );
    if (mouseEventsTaskPid) {
      await execAsync(`taskkill /F /PID ${mouseEventsTaskPid}`);
    }
  }

  /**
   * Получение текущей ссылки, открытой в браузере
   * @param {Object} params - объект с параметрами запроса
   * @param {string[]} params.links - массив с ссылками
   * @param {boolean} params.train - идентификатор тренировки
   */
  async getCurrentBrowserLink({ links, train }) {
    const stdout = await execAsync(
      `"${path.join(__dirname, '..', 'getCurrentBrowserTab', 'Project1.exe')}"`,
    );
    if (stdout !== ' ') {
      const processedStdout = stdout.replace(/\/[^]+/, '').trim();
      if (links.filter((link) => link === processedStdout).length) {
        this.browserTabs.push(
          `${moment().format('YYYY-MM-DD HH:mm:ss')}, ${processedStdout}\n`,
        );
      }
    }
    if (this.browserTabs.length >= 10) {
      for (const app of this.browserTabs) {
        await fs.promises.appendFile(`./files/${train ? 'train' : 'predict'}/results-active-tab.txt`, app);
      }
      this.browserTabs = [];
    }
  }
}

module.exports = new AppMonitoringService();
