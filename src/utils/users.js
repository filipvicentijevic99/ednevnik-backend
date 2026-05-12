const ROLE_VALUES = ["ADMIN", "TEACHER", "STUDENT"];
const ADMIN_CREATABLE_ROLES = ["TEACHER", "STUDENT"];

function normalizeEmail(email) {
  if (typeof email !== "string") {
    return "";
  }

  return email.trim().toLowerCase();
}

function normalizeName(name) {
  if (typeof name !== "string") {
    return "";
  }

  return name.trim();
}

function isRole(value) {
  return ROLE_VALUES.includes(value);
}

function isAdminCreatableRole(value) {
  return ADMIN_CREATABLE_ROLES.includes(value);
}

function selectPublicUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

module.exports = {
  ROLE_VALUES,
  ADMIN_CREATABLE_ROLES,
  normalizeEmail,
  normalizeName,
  isRole,
  isAdminCreatableRole,
  selectPublicUser,
};
