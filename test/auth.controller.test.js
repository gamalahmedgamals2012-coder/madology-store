const test = require("node:test");
const assert = require("node:assert/strict");
const { validateRegistrationInput, normalizeUsername } = require("../src/controllers/auth.controller");
const User = require("../src/models/User");

const valid = { username: "mado_user", name: "Mado User", address: "Beni Suef, Egypt", phone: "123456789", password: "secret123", latitude: 29, longitude: 31 };

test("registration validates username/password and existing profile fields", () => {
  assert.doesNotThrow(() => validateRegistrationInput(valid));
  assert.equal(normalizeUsername("  Mado_User "), "mado_user");
});

test("registration rejects invalid usernames and email-shaped input", () => {
  assert.throws(() => normalizeUsername("bad name"), /Username must be/);
  assert.throws(() => normalizeUsername("user@example.com"), /Username must be/);
});

test("final User schema contains username but no email or verification state", () => {
  assert.ok(User.schema.path("username"));
  assert.equal(User.schema.path("email"), undefined);
  assert.equal(User.schema.path("verified"), undefined);
  assert.equal(User.schema.path("emailVerified"), undefined);
  assert.equal(User.schema.path("verificationToken"), undefined);
});
