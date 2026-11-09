'use strict';

const { AppError } = require('../utils/errors');

function createErrorHandler(logger) {
  return (error, req) => {
    const requestId = req ? req.id : undefined;
    if (error instanceof AppError) {
      return {
        status: error.status,
        body: { error: { code: error.code, message: error.message, details: error.details, requestId } },
      };
    }
    logger.error('Error no controlado', { message: error.message, requestId });
    return {
      status: 500,
      body: { error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor', requestId } },
    };
  };
}

module.exports = { createErrorHandler };
