'use strict';

function createRequestLogger(logger) {
  return (req) => {
    logger.info(`${req.method} ${req.path}`);
  };
}

module.exports = { createRequestLogger };
