/**
 * Машруты /api/processing
 * @namespace ProcessingRoutes
 */
const Router = require('koa-router');
const ProcessingController = require('../controllers/processing.controller');

const router = new Router();
/**
 * @name Установка статуса пользователя: активный/неактивный режим
 * @memberof! ProcessingRoutes
 * @path {POST} /api/processing/status
 * @body {boolean} active - идентификатор активности пользователя
 * @code {200} Успешно
 * @code {500} Ошибка сервера
 */
router.post('/status', ProcessingController.setStatus);
/**
 * @name Остановка процесса сбора данных пользователя
 * @memberof! ProcessingRoutes
 * @path {POST} /api/processing/start
 * @body {boolean} train - идентификатор тренировки модели
 * @code {200} Успешно
 * @code {500} Ошибка сервера
 */
router.post('/stop', ProcessingController.stopProcessing);
/**
 * @name Старт процесса сбора данных пользователя
 * @memberof! ProcessingRoutes
 * @path {POST} /api/processing/start
 * @body {boolean} train - идентификатор тренировки модели
 * @body {string[]} apps - массив приложений, которые необходимо учитывать при сборе данных
 * @body {string[]} links - массив ссылок, которые необходимо учитывать при сборе данных
 * @code {200} Успешно
 * @code {500} Ошибка сервера
 */
router.post('/start', ProcessingController.startProcessing);
/**
 * @name Генерация json'a для датасета
 * @memberof! ProcessingRoutes
 * @path {POST} /api/processing/start
 * @body {boolean} use_mobile - идентификатор использования мобильного телефона в анализе
 * @body {boolean} train - идентификатор тренировки модели
 * @body {string[]} apps - массив приложений, которые необходимо учитывать при сборе данных
 * @body {string[]} links - массив ссылок, которые необходимо учитывать при сборе данных
 * @code {200} Успешно
 * @code {500} Ошибка сервера
 */
router.post('/json', ProcessingController.generateJson);
/**
 * @name Генерация датасета
 * @memberof! ProcessingRoutes
 * @path {POST} /api/processing/start
 * @body {string[]} apps - массив приложений, которые необходимо учитывать при сборе данных
 * @body {string[]} links - массив ссылок, которые необходимо учитывать при сборе данных
 * @code {200} Успешно
 * @code {500} Ошибка сервера
 */
router.post('/dataset', ProcessingController.generateDataset);
/**
 * @name Тренировка и сохранение модели
 * @memberof! ProcessingRoutes
 * @path {POST} /api/processing/train
 * @body {string} model_name - наименование модели
 * @body {string[]} apps - массив приложений, которые необходимо учитывать при сборе данных
 * @body {string[]} links - массив ссылок, которые необходимо учитывать при сборе данных
 * @body {boolean} python - использовать скрипт на питоне или готовый exe
 * @code {200} Успешно
 * @code {500} Ошибка сервера
 */
router.post('/train', ProcessingController.trainModel);
/**
 * @name Определение flow state на основе имеющихся данных
 * @memberof! ProcessingRoutes
 * @path {POST} /api/processing/predict
 * @body {boolean} use_mobile - идентификатор использования мобильного телефона в анализе
 * @body {string} model_name - наименование модели
 * @body {string} date_from - дата с (с указанием времени вплоть до минут)
 * @body {string} date_to - дата по (с указанием времени вплоть до минут)
 * @body {string[]} apps - массив приложений, которые необходимо учитывать при сборе данных
 * @body {string[]} links - массив ссылок, которые необходимо учитывать при сборе данных
 * @body {boolean} python - использовать скрипт на питоне или готовый exe
 * @code {200} Успешно
 * @code {500} Ошибка сервера
 */
router.post('/predict', ProcessingController.predict);

module.exports = router;
