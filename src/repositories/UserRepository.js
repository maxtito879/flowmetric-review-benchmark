'use strict';

class UserRepository {
  constructor() {
    this.users = new Map();
  }

  async save(user) {
    this.users.set(user.id, { ...user });
    return { ...user };
  }

  async findById(id) {
    const user = this.users.get(id);
    return user ? { ...user } : null;
  }

  async findByEmail(email) {
    for (const user of this.users.values()) {
      if (user.email === email) return { ...user };
    }
    return null;
  }
}

module.exports = { UserRepository };
