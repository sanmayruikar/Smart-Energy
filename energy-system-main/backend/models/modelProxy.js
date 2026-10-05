const mongoose = require('mongoose');
const { getCollection } = require('../config/inMemoryStore');

const createModelProxy = (modelName, mongooseModel) => {
  return new Proxy(mongooseModel, {
    get(target, prop) {
      if (mongoose.connection.readyState === 1) {
        return target[prop];
      }
      const fallback = getCollection(modelName);
      if (typeof fallback[prop] === 'function') {
        return fallback[prop].bind(fallback);
      }
      if (prop in fallback) {
        return fallback[prop];
      }
      return target[prop];
    },
  });
};

module.exports = { createModelProxy };
