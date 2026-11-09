'use strict';

class NotificationService {
  constructor({ logger } = {}) {
    this.logger = logger;
    this.events = [];
  }

  async notify(type, payload) {
    const event = { type, payload, at: new Date().toISOString() };
    this.events.push(event);
    if (this.logger) this.logger.debug(`event ${type}`, payload);
    return event;
  }

  list(type) {
    return type ? this.events.filter((event) => event.type === type) : [...this.events];
  }
}

module.exports = { NotificationService };
