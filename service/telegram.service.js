/* eslint-disable camelcase */
/* eslint-disable max-len */
/* eslint-disable no-plusplus */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
const { MTProto } = require('@mtproto/core');
const requestPromise = require('request-promise');
const { parse } = require('node-html-parser');
const { MTProto: SignUpMTProto } = require('telegram-mtproto');
const allSettled = require('../utils/allSettled.polyfill');
/**
 * Сервис для работы со скриптом, получающим текущее используемое приложение и текущую ссылку при использовании браузера
 */
class AppMonitoringService {
  constructor() {
    this.telegramAPIHandler = null;
    this.telegramSignUpHandler = null;
    this.api_hash = null;
    this.api_id = null;
  }

  /**
   * Привязка телефона для использования Telegram API
   * @param {object} param - объект запроса
   * @param {string} param.phone_number - номер телефона пользователя
   * @param {string} param.phone_code_hash - хэш, полученный из данных первого этапа получения кода
   * @param {string} param.phone_code - код, полученный из сообщения
   * @param {string} param.first_name - имя
   * @param {string} param.last_name - фамилия
   */
  async signUp({
    phone_number, phone_code_hash, first_name, last_name, phone_code,
  }) {
    const result = await this.telegramSignUpHandler('auth.signUp', {
      phone_number,
      phone_code_hash,
      first_name,
      last_name,
      phone_code,
    });
    return result;
  }

  /**
   * Получение пользователей и чатов из последних сообщений
   * @param {object} param - объект запроса
   * @param {object[]} param.users - пользователи, нотификации которых нужно отключить
   * @param {object[]} param.chats - чаты, нотификации которых нужно отключить
   * @param {number} param.mute_time - время, на которое необходимо отключить уведомления(в секундах)
   */
  async muteChannelsAndUsers({ users, chats, mute_time }) {
    const usersMutePromises = [];
    const chatsMutePromises = [];
    for (const user of users) {
      usersMutePromises.push(this.telegramAPIHandler.call('account.updateNotifySettings', {
        peer: {
          _: 'inputNotifyPeer',
          peer: {
            _: 'inputPeerUser',
            user_id: user.id,
            access_hash: user.access_hash,
          },
        },
        settings: {
          _: 'inputPeerNotifySettings',
          pFlags: {},
          flags: 15,
          show_previews: false,
          silent: true,
          mute_until: Math.round(new Date().getTime() / 1000) + mute_time,
          sound: 'default',
        },
      }));
    }
    for (const chat of chats) {
      chatsMutePromises.push(this.telegramAPIHandler.call('account.updateNotifySettings', {
        peer: {
          _: 'inputNotifyPeer',
          peer: {
            _: 'inputPeerChannel',
            channel_id: chat.id,
            access_hash: chat.access_hash,
          },
        },
        settings: {
          _: 'inputPeerNotifySettings',
          pFlags: {},
          flags: 15,
          show_previews: false,
          silent: true,
          mute_until: Math.round(new Date().getTime() / 1000) + mute_time,
          sound: 'default',
        },
      }));
    }
    const usersResult = await allSettled(usersMutePromises);
    const chatsResult = await allSettled(chatsMutePromises);
    return { usersResult, chatsResult };
  }

  /**
   * Получение пользователей и чатов из последних сообщений
   */
  async getUsersAndChannels() {
    let { users } = await this.telegramAPIHandler.call('contacts.getContacts', {});
    let { chats } = await this.telegramAPIHandler.call('messages.getAllChats', { except_ids: [] });
    users = users.map(async (user) => {
      let image_url = null;
      if (user.username) {
        const page = await requestPromise(`https://t.me/${user.username}`, {
          method: 'GET',
        });
        const root = parse(page);
        const image = root.querySelector('img.tgme_page_photo_image');
        image_url = image && image.rawAttributes ? image.rawAttributes.src : null;
      }
      return {
        id: user.id,
        access_hash: user.access_hash,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        username: user.username || '',
        image_url: image_url || 'https://test.developmentandscorp.tech/user.svg',
      };
    });
    chats = chats.map(async (chat) => {
      let image_url = null;
      if (chat.username) {
        const page = await requestPromise(`https://t.me/${chat.username}`, {
          method: 'GET',
        });
        const root = parse(page);
        const image = root.querySelector('img.tgme_page_photo_image');
        image_url = image && image.rawAttributes ? image.rawAttributes.src : null;
      }
      return {
        id: chat.id,
        access_hash: chat.access_hash,
        username: chat.username || '',
        title: chat.title || '',
        image_url: image_url || 'https://capenetworks.com/static/images/testimonials/user-icon.svg',
      };
    });
    users = await Promise.all(users);
    chats = await Promise.all(chats);
    return { users, chats };
  }

  /**
   * Авторизация для использования Telegram API
   * @param {object} param - объект запроса
   * @param {string} param.phone_number - номер телефона пользователя
   * @param {string} param.phone_code_hash - хэш, полученный из данных первого этапа получения кода
   * @param {string} param.code - код, полученный из смс телеграма
   */
  async login({ phone_number, phone_code_hash, code }) {
    const { user } = await this.telegramAPIHandler.call('auth.signIn', {
      phone_number,
      phone_code_hash,
      phone_code: code,
    });
    return user;
  }

  /**
   * Получение кода для дальнейшей авторизации
   * @param {object} param - объект запроса
   * @param {string} param.phone_number - номер телефона пользователя
   */
  async getSignUpCode({ phone_number }) {
    const result = await this.telegramSignUpHandler('auth.sendCode', {
      phone_number,
      api_id: this.api_id,
      api_hash: this.api_hash,
    });
    return result;
  }

  /**
   * Получение кода для дальнейшей авторизации
   * @param {object} param - объект запроса
   * @param {string} param.phone_number - номер телефона пользователя
   */
  async getCode({ phone_number }) {
    const result = await this.telegramAPIHandler.call('auth.sendCode', {
      phone_number,
      settings: {
        _: 'codeSettings',
      },
    });
    return result;
  }

  /**
   * Метод для инициализации клиента телеграм
   * (для инициализации при запуске сервера при наличии конфигурации и для установки в режиме работы программы)
   * @param {object} obj - объект с данными запроса
   * @param {number} obj.api_id - идентификатор  приложения в телеграме
   * @param {string} obj.api_hash -  хэш приложения в телеграме
   */
  initClient({ api_id, api_hash }) {
    this.api_id = api_id;
    this.api_hash = api_hash;
    this.telegramAPIHandler = new MTProto({
      api_id,
      api_hash,
    });
    const server = {
      dev: true,
    };
    const api = {
      layer: 57,
      initConnection: 0x69796de9,
      api_id,
    };
    this.telegramSignUpHandler = SignUpMTProto({ server, api });
  }
}

module.exports = new AppMonitoringService();
