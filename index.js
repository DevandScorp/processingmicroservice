const koa = require('koa');
const bodyParser = require('koa-bodyparser');
const Router = require('koa-router');
const morgan = require('koa-morgan');
const cors = require('@koa/cors');
const errorHandlerMiddleware = require('./middlewares/errorHandler.middleware');

const app = new koa();

let koaServer;
process.on('SIGINT', async () => {
  koaServer.close(() => process.exit());
});
process.on('SIGTERM', async () => {
  koaServer.close(() => process.exit());
});
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
if (process.env.NODE_ENV !== 'production') app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));

app.use(errorHandlerMiddleware);
app.use(cors());
app.use(bodyParser({ formLimit: '50mb', jsonLimit: '50mb' }));

/**
 * Добавление маршрутов
 */
const routes = require('./routes');

const router = new Router();
router.use('/api', routes.routes());
app.use(router.routes());
koaServer = app.listen(+process.env.PORT, () => {
  console.log('STARTED');
});
