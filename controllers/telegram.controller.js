/* eslint-disable camelcase */
/* eslint-disable no-throw-literal */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-return-assign */
// @ts-nocheck
const TelegramService = require('../service/telegram.service');
/** Класс работы с Telegram API */
class TelegramController {
  /**
   * Авторизация для использования Telegram API
   * @param {object} ctx - Koa context object
   * @returns {Promise<void>}
   */
  async muteChannelsAndUsers(ctx) {
    const { users, chats, mute_time } = ctx.request.body;
    if (!users || !chats || !mute_time) throw 'Не указан один из обязательных параметров: users, chats, mute_time';
    return ctx.body = await TelegramService.muteChannelsAndUsers({ users, chats, mute_time });
  }

  /**
   * Привязка телефона для использования Telegram API
   * @param {object} ctx - Koa context object
   * @returns {Promise<void>}
   */
  async signUp(ctx) {
    const {
      phone_number, phone_code_hash, first_name, last_name, phone_code,
    } = ctx.request.body;
    if (!phone_number || !phone_code_hash || !first_name || !last_name) throw 'Не указано одно или несколько полей: phone_number, phone_code_hash, first_name, last_name';
    return ctx.body = await TelegramService.signUp({
      phone_number, phone_code_hash, first_name, last_name, phone_code,
    });
  }

  /**
   * Авторизация для использования Telegram API
   * @param {object} ctx - Koa context object
   * @returns {Promise<void>}
   */
  async login(ctx) {
    const { phone_number, phone_code_hash, code } = ctx.request.body;
    if (!phone_number || !phone_code_hash || !code) throw 'Не указано одно или несколько полей: phone_number, phone_code_hash, code';
    return ctx.body = await TelegramService.login({ phone_number, phone_code_hash, code });
  }

  /**
   * Получение кода для авторизации в телеграме
   * @param {object} ctx - Koa context object
   * @returns {Promise<void>}
   */
  async getCode(ctx) {
    const { phone_number } = ctx.request.query;
    if (!phone_number) throw 'Не указано поле phone_number';
    return ctx.body = await TelegramService.getCode({ phone_number });
  }

  /**
   * Получение кода для регистрации в телеграме
   * @param {object} ctx - Koa context object
   * @returns {Promise<void>}
   */
  async getSignUpCode(ctx) {
    const { phone_number } = ctx.request.query;
    if (!phone_number) throw 'Не указано поле phone_number';
    return ctx.body = await TelegramService.getSignUpCode({ phone_number });
  }

  /**
   * Получение пользователей и чатов из последних сообщений
   * @param {object} ctx - Koa context object
   * @returns {Promise<void>}
   */
  async getUsersAndChannels(ctx) {
    return ctx.body = await TelegramService.getUsersAndChannels();
  }

  /**
   * Инициализация клиента в телеграме
   * @param {object} ctx - Koa context object
   * @returns {Promise<void>}
   */
  async initClient(ctx) {
    const { api_id, api_hash } = ctx.request.body;
    if (!api_id || !api_hash) throw 'Поля api_id или api_hash не были указаны';
    await TelegramService.initClient({ api_id, api_hash });
    return ctx.body = { message: 'OK' };
  }
}
module.exports = new TelegramController();
