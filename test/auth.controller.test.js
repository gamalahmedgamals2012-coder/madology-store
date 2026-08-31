const test = require("node:test");
const assert = require("node:assert/strict");
const {
  validateRegistrationInput,
  normalizeAddressDetails
} = require("../src/controllers/auth.controller");
const { getVerificationExpiryDate } = require("../src/services/token.service");

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

test("validateRegistrationInput rejects missing or non-finite coordinate values", () => {
  const basePayload = {
    name: "Mado User",
    email: "user@example.com",
    address: "Beni Suef, Egypt",
    phone: "123456789",
    password: "secret123",
    latitude: 29.0661,
    longitude: 31.0994
  };

  for (const latitude of ["", "   ", null, undefined, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(() => {
      validateRegistrationInput({
        ...basePayload,
        latitude
      });
    }, /Latitude must be a number between -90 and 90/);
  }

  for (const longitude of ["", "   ", null, undefined, Number.NaN, Number.NEGATIVE_INFINITY]) {
    assert.throws(() => {
      validateRegistrationInput({
        ...basePayload,
        longitude
      });
    }, /Longitude must be a number between -180 and 180/);
  }
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

test("verification expiry supports legacy email expiry environment name", () => {
  const originalCodeExpiry = process.env.EMAIL_VERIFICATION_CODE_EXPIRES_MINUTES;
  const originalLegacyExpiry = process.env.EMAIL_VERIFICATION_EXPIRES_IN;

  delete process.env.EMAIL_VERIFICATION_CODE_EXPIRES_MINUTES;
  process.env.EMAIL_VERIFICATION_EXPIRES_IN = "15";

  try {
    const before = Date.now();
    const expiry = getVerificationExpiryDate().getTime();
    const after = Date.now();

    assert.ok(expiry >= before + 15 * 60 * 1000);
    assert.ok(expiry <= after + 15 * 60 * 1000);
  } finally {
    if (originalCodeExpiry === undefined) {
      delete process.env.EMAIL_VERIFICATION_CODE_EXPIRES_MINUTES;
    } else {
      process.env.EMAIL_VERIFICATION_CODE_EXPIRES_MINUTES = originalCodeExpiry;
    }

    if (originalLegacyExpiry === undefined) {
      delete process.env.EMAIL_VERIFICATION_EXPIRES_IN;
    } else {
      process.env.EMAIL_VERIFICATION_EXPIRES_IN = originalLegacyExpiry;
    }
  }
});
