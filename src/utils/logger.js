'use strict';

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 100 };

function createLogger({ level = 'info', sink = console } = {}) {
  const threshold = LEVELS[level] ?? LEVELS.info;

  const write = (name) => (message, meta) => {
    if (LEVELS[name] < threshold) return;
    const line = meta ? `${message} ${JSON.stringify(meta)}` : message;
    sink[name === 'debug' ? 'log' : name](`[${name}] ${line}`);
  };

  return {
    debug: write('debug'),
    info: write('info'),
    warn: write('warn'),
    error: write('error'),
  };
}

module.exports = { createLogger };
