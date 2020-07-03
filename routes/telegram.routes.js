/**
 * Машруты /api/telegram
 * @namespace TelegramRoutes
 */
const Router = require('koa-router');
const TelegramController = require('../controllers/telegram.controller');

const router = new Router();
/**
 * @name Инициализация клиента в телеграме
 * @memberof! TelegramRoutes
 * @path {POST} /api/telegram/start
 * @body {string} api_id - идентификатор приложения в телеграме
 * @body {string} api_hash - хэш приложения в телеграме
 * @code {200} Успешно
 * @code {500} Ошибка сервера
 */
router.post('/init', TelegramController.initClient);
/**
 * @name Получение кода для авторизации в телеграме
 * @memberof! TelegramRoutes
 * @path {GET} /api/telegram/code
 * @query {string} phone_number - телефонный номер пользователя
 * @code {200} Успешно
 * @code {500} Ошибка сервера
 */
router.get('/code', TelegramController.getCode);
/**
 * @name Авторизация для использования Telegram API
 * @memberof! TelegramRoutes
 * @path {POST} /api/telegram/login
 * @body {string} phone_number - номер телефона пользователя
 * @body {string} phone_code_hash - хэш, полученный из данных первого этапа получения кода
 * @body {string} code - код, полученный из смс телеграма
 * @code {200} Успешно
 * @code {500} Ошибка сервера
 */
router.post('/login', TelegramController.login);
/**
 * @name Привязка телефона для использования Telegram API
 * @memberof! TelegramRoutes
 * @path {POST} /api/telegram/signup
 * @body {string} phone_number - номер телефона пользователя
 * @body {string} phone_code_hash - хэш, полученный из данных первого этапа получения кода
 * @body {string} first_name - имя
 * @body {string} last_name - фамилия
 * @code {200} Успешно
 * @code {500} Ошибка сервера
 */
router.post('/signup', TelegramController.signUp);
/**
 * @name Получение кода для регистрации в телеграме
 * @memberof! TelegramRoutes
 * @path {GET} /api/telegram/signup/code
 * @query {string} phone_number - телефонный номер пользователя
 * @code {200} Успешно
 * @code {500} Ошибка сервера
 */
router.get('/signup/code', TelegramController.getSignUpCode);
/**
 * @name Получение пользователей и чатов из последних сообщений
 * @memberof! TelegramRoutes
 * @path {GET} /api/telegram/users
 * @code {200} Успешно
 * @code {500} Ошибка сервера
 */
router.get('/users', TelegramController.getUsersAndChannels);
/**
 * @name Отключение нотификаций пользователя
 * @memberof! TelegramRoutes
 * @path {POST} /api/telegram/mute
 * @body {object[]} users - пользователи, нотификации которых нужно отключить
 * @body {object[]} chats - чаты, нотификации которых нужно отключить
 * @code {200} Успешно
 * @code {500} Ошибка сервера
 */
router.post('/mute', TelegramController.muteChannelsAndUsers);
module.exports = router;
