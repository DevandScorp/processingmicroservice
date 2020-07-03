/**
 * Полифил для Promise.allSettled
 * @param {Promise[]} promises - массив промисов
 */
module.exports = (promises) => {
  const mappedPromises = promises.map((p) => p
    .then((value) => ({
      status: 'fulfilled',
      value,
    }))
    .catch((reason) => ({
      status: 'rejected',
      reason,
    })));
  return Promise.all(mappedPromises);
};
