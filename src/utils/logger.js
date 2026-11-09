'use strict';

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 100 };

function renderLine(format, name, message, meta) {
  if (format === 'json') {
    return JSON.stringify({ level: name, message, ...meta });
  }
  return `[${name}] ${meta ? `${message} ${JSON.stringify(meta)}` : message}`;
}

function createLogger({ level = 'info', sink = console, format = 'text' } = {}) {
  const threshold = LEVELS[level] ?? LEVELS.info;

  const write = (name) => (message, meta) => {
    if (LEVELS[name] < threshold) return;
    sink[name === 'debug' ? 'log' : name](renderLine(format, name, message, meta));
  };

  return {
    debug: write('debug'),
    info: write('info'),
    warn: write('warn'),
    error: write('error'),
  };
}

module.exports = { createLogger };
