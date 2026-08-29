const test = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizeLatitude,
  normalizeLongitude,
  normalizeAddressDetails
} = require("../src/controllers/location.controller");

test("normalizeLatitude accepts a valid coordinate", () => {
  assert.equal(normalizeLatitude(29.0661), 29.0661);
});

test("normalizeLatitude rejects invalid coordinates", () => {
  assert.throws(() => normalizeLatitude(100), /Latitude must be a number between -90 and 90/);
});

test("normalizeLongitude rejects invalid coordinates", () => {
  assert.throws(() => normalizeLongitude(200), /Longitude must be a number between -180 and 180/);
});

test("normalizeAddressDetails rejects malformed address objects", () => {
  assert.throws(() => normalizeAddressDetails("not-an-object"), /Address details must be an object/);
});
