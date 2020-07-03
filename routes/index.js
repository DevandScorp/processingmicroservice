const Router = require('koa-router');

const router = new Router();
const processingRoutes = require('./processing.routes');
const telegramRoutes = require('./telegram.routes');

router.use('/processing', processingRoutes.routes());
router.use('/telegram', telegramRoutes.routes());

module.exports = router;
