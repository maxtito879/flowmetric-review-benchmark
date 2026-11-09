'use strict';

const { AppError } = require('../utils/errors');

function createErrorHandler(logger) {
  return (error) => {
    if (error instanceof AppError) {
      return {
        status: error.status,
        body: { error: { code: error.code, message: error.message, details: error.details } },
      };
    }
    logger.error('Error no controlado', { message: error.message });
    return {
      status: 500,
      body: { error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' } },
    };
  };
}

module.exports = { createErrorHandler };
