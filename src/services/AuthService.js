'use strict';

const crypto = require('node:crypto');
const { ROLES, TOKEN_TTL_SECONDS } = require('../config/constants');
const { ConflictError, UnauthorizedError } = require('../utils/errors');
const { newId } = require('../utils/ids');
const { toPublicUser } = require('../utils/serializers');
const { systemClock } = require('../utils/clock');

class AuthService {
  constructor({ userRepository, tokenSecret, clock = systemClock, tokenTtlSeconds = TOKEN_TTL_SECONDS }) {
    if (!tokenSecret) {
      throw new Error('tokenSecret es obligatorio');
    }
    this.userRepository = userRepository;
    this.tokenSecret = tokenSecret;
    this.clock = clock;
    this.tokenTtlSeconds = tokenTtlSeconds;
  }

  hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 32).toString('hex');
    return `${salt}:${hash}`;
  }

  verifyPassword(password, stored) {
    const [salt, hash] = stored.split(':');
    const expected = Buffer.from(hash, 'hex');
    const candidate = crypto.scryptSync(password, salt, expected.length);
    return crypto.timingSafeEqual(candidate, expected);
  }

  async createUser({ email, password, name, role = ROLES.CUSTOMER }) {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await this.userRepository.findByEmail(normalizedEmail);
    if (existing) {
      throw new ConflictError('El correo ya está registrado');
    }

    const user = {
      id: newId('usr'),
      email: normalizedEmail,
      name,
      role,
      passwordHash: this.hashPassword(password),
      createdAt: this.clock.now().toISOString(),
    };
    await this.userRepository.save(user);
    return toPublicUser(user);
  }

  async register({ email, password, name }) {
    return this.createUser({ email, password, name, role: ROLES.CUSTOMER });
  }

  async login({ email, password }) {
    const user = await this.userRepository.findByEmail(email.trim().toLowerCase());
    if (!user || !this.verifyPassword(password, user.passwordHash)) {
      throw new UnauthorizedError('Credenciales inválidas');
    }
    return { token: this.issueToken(user), user: toPublicUser(user) };
  }

  sign(data) {
    return crypto.createHmac('sha256', this.tokenSecret).update(data).digest('base64url');
  }

  issueToken(user) {
    const nowSeconds = Math.floor(this.clock.now().getTime() / 1000);
    const payload = { sub: user.id, exp: nowSeconds + this.tokenTtlSeconds };
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    return `${body}.${this.sign(body)}`;
  }

  verifyToken(token) {
    const [body, signature] = String(token).split('.');
    if (!body || !signature) {
      throw new UnauthorizedError('Token inválido');
    }

    const expected = Buffer.from(this.sign(body));
    const received = Buffer.from(signature);
    if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
      throw new UnauthorizedError('Token inválido');
    }

    let payload;
    try {
      payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    } catch {
      throw new UnauthorizedError('Token inválido');
    }

    const nowSeconds = Math.floor(this.clock.now().getTime() / 1000);
    if (typeof payload.exp !== 'number' || payload.exp <= nowSeconds) {
      throw new UnauthorizedError('Token expirado');
    }
    return payload;
  }

  async authenticate(token) {
    const payload = this.verifyToken(token);
    const user = await this.userRepository.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedError('Token inválido');
    }
    return toPublicUser(user);
  }
}

module.exports = { AuthService };
