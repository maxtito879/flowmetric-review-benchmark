'use strict';

function createRequestLogger(logger) {
  return (req) => {
    logger.info(`${req.method} ${req.path}`, { requestId: req.id, queryParams: Object.keys(req.query).length });
  };
}

module.exports = { createRequestLogger };
