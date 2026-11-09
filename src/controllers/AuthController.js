'use strict';

const { validateLogin, validateRegister } = require('../validators/authValidator');

class AuthController {
  constructor({ authService }) {
    this.authService = authService;
  }

  async register(req) {
    const input = validateRegister(req.body);
    const user = await this.authService.register(input);
    return { status: 201, body: { user } };
  }

  async login(req) {
    const input = validateLogin(req.body);
    const session = await this.authService.login(input);
    return { status: 200, body: session };
  }

  async me(req) {
    return { status: 200, body: { user: req.user } };
  }
}

module.exports = { AuthController };
