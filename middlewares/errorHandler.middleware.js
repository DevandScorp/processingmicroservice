/**
 * Обработка ошибок
 * @return {Promise}
 */
module.exports = async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.statusCode || 500;
    ctx.body = {
      message: err.message || err,
    };
  }
};
