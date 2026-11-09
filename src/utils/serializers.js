'use strict';

/**
 * Representación pública de un usuario: nunca incluye el hash de la contraseña.
 */
function toPublicUser(user) {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

module.exports = { toPublicUser };
