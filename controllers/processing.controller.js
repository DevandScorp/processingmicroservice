/* eslint-disable camelcase */
/* eslint-disable no-throw-literal */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-return-assign */
// @ts-nocheck
const AppMonitoringService = require('../service/appmonitoring.service');
/** Класс работы с процессом обработки данных */
class ProcessingController {
  /**
   * Тренировка и сохранение модели
   * @param {object} ctx - Koa context object
   * @returns {Promise<object>}
   */
  async predict(ctx) {
    const {
      date_from, date_to, apps, links,
    } = ctx.request.body;
    if (!apps || !apps.length) throw 'Список приложений не был передан';
    if (!links || !apps.length) throw 'Список ссылок не был передан';
    if (!date_from || !date_to) throw 'Не были переданы дата с или дата по';
    const result = await AppMonitoringService.predict({
      date_from, date_to, apps, links,
    });
    return ctx.body = { predictions: result };
  }

  /**
   * Тренировка и сохранение модели
   * @param {object} ctx - Koa context object
   * @returns {Promise<object>}
   */
  async trainModel(ctx) {
    await AppMonitoringService.trainModel();
    return ctx.body = { message: 'OK' };
  }

  /**
   * Установка статуса пользователя: активный/неактивный режим
   * @param {object} ctx - Koa context object
   * @returns {Promise<object>}
   */
  async setStatus(ctx) {
    const { active } = ctx.request.body;
    if (active === undefined) throw 'Не был передан параметр active';
    await AppMonitoringService.setStatus({ active });
    return ctx.body = { message: 'OK' };
  }

  /**
   * Остановка процесса сбора данных пользователя
   * @param {object} ctx - Koa context object
   * @returns {Promise<object>}
   */
  async stopProcessing(ctx) {
    const { train } = ctx.request.body;
    if (train === undefined) throw 'Не был передан идентификатор тренировки модели';
    await AppMonitoringService.stopMonitoring({ train });
    return ctx.body = { message: 'OK' };
  }

  /**
   * Генерация датасета
   * @param {object} ctx - Koa context object
   * @returns {Promise<object>}
   */
  async generateDataset(ctx) {
    const { apps, links } = ctx.request.body;
    if (!apps || !apps.length) throw 'Список приложений не был передан';
    if (!links || !apps.length) throw 'Список ссылок не был передан';
    await AppMonitoringService.generateDataset({ apps, links });
    return ctx.body = { message: 'OK' };
  }

  /**
   * Генерация json для последующего обучения
   * @param {object} ctx - Koa context object
   * @returns {Promise<object>}
   */
  async generateJson(ctx) {
    const { train } = ctx.request.body;
    if (train === undefined) throw 'Не был передан идентификатор тренировки модели';
    const result = await AppMonitoringService.generateJson({ train });
    return ctx.body = result;
  }

  /**
   * Старт процесса сбора данных пользователя
   * @param {object} ctx - Koa context object
   * @returns {Promise<object>}
   */
  startProcessing = async (ctx) => {
    const { apps, links, train } = ctx.request.body;
    if (!apps || !apps.length) throw 'Список приложений для мониторинга не был передан';
    if (!links || !apps.length) throw 'Список ссылок для мониторинга не был передан';
    if (train === undefined) throw 'Не был передан идентификатор тренировки модели';
    await AppMonitoringService.startMonitoring({ apps, links, train });
    return ctx.body = { message: 'OK' };
  }
}
module.exports = new ProcessingController();
