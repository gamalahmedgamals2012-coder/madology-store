const test = require("node:test");
const assert = require("node:assert/strict");
const { validateRegistrationInput, normalizeUsername } = require("../src/controllers/auth.controller");
const User = require("../src/models/User");

const valid = { username: "mado_user", address: "Beni Suef, Egypt", phone: "123456789", password: "secret123", latitude: 29, longitude: 31 };

test("registration validates username/password and existing profile fields", () => {
  assert.doesNotThrow(() => validateRegistrationInput(valid));
  assert.equal(normalizeUsername("  Mado User  "), "Mado User");
});

test("registration allows spaces and arbitrary username characters", () => {
  assert.equal(normalizeUsername("user@example.com"), "user@example.com");
  assert.equal(normalizeUsername("اسم مستخدم 123"), "اسم مستخدم 123");
  assert.throws(() => normalizeUsername("ab"), /between 3 and 36/);
  assert.throws(() => normalizeUsername("x".repeat(37)), /between 3 and 36/);
});

test("final User schema contains username but no email or verification state", () => {
  assert.ok(User.schema.path("username"));
  assert.equal(User.schema.path("email"), undefined);
  assert.equal(User.schema.path("verified"), undefined);
  assert.equal(User.schema.path("emailVerified"), undefined);
  assert.equal(User.schema.path("verificationToken"), undefined);
});
