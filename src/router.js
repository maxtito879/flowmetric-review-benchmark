'use strict';

class Router {
  constructor() {
    this.routes = [];
  }

  add(method, pattern, handlers) {
    const keys = [];
    const source = pattern.replace(/:([a-zA-Z]+)/g, (_, key) => {
      keys.push(key);
      return '([^/]+)';
    });
    this.routes.push({ method, regex: new RegExp(`^${source}$`), keys, handlers });
  }

  match(method, path) {
    for (const route of this.routes) {
      const found = route.regex.exec(path);
      if (found && route.method === method) {
        const params = Object.fromEntries(
          route.keys.map((key, index) => [key, decodeURIComponent(found[index + 1])]),
        );
        return { handlers: route.handlers, params };
      }
    }
    return null;
  }
}

module.exports = { Router };
