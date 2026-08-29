const test = require("node:test");
const assert = require("node:assert/strict");
const {
  validateRegistrationInput,
  normalizeAddressDetails
} = require("../src/controllers/auth.controller");

test("validateRegistrationInput accepts a complete map-based registration payload", () => {
  assert.doesNotThrow(() => {
    validateRegistrationInput({
      name: "Mado User",
      email: "user@example.com",
      address: "Beni Suef, Egypt",
      phone: "123456789",
      password: "secret123",
      latitude: 29.0661,
      longitude: 31.0994,
      addressDetails: {
        city: "Beni Suef",
        state: "Beni Suef Governorate",
        country: "Egypt",
        postalCode: "12345"
      }
    });
  });
});

test("validateRegistrationInput rejects invalid latitude values", () => {
  assert.throws(() => {
    validateRegistrationInput({
      name: "Mado User",
      email: "user@example.com",
      address: "Beni Suef, Egypt",
      phone: "123456789",
      password: "secret123",
      latitude: 200,
      longitude: 31.0994
    });
  }, /Latitude must be a number between -90 and 90/);
});

test("validateRegistrationInput rejects invalid longitude values", () => {
  assert.throws(() => {
    validateRegistrationInput({
      name: "Mado User",
      email: "user@example.com",
      address: "Beni Suef, Egypt",
      phone: "123456789",
      password: "secret123",
      latitude: 29.0661,
      longitude: -200
    });
  }, /Longitude must be a number between -180 and 180/);
});

test("normalizeAddressDetails rejects malformed location objects", () => {
  assert.throws(() => normalizeAddressDetails(["not-an-object"]), /Address details must be an object/);
});
