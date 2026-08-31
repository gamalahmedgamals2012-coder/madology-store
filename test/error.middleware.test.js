const test = require("node:test");
const assert = require("node:assert/strict");
const { errorHandler, isProductionRuntime } = require("../src/middleware/error.middleware");

test("isProductionRuntime treats Vercel as production-like", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalVercel = process.env.VERCEL;

  delete process.env.NODE_ENV;
  process.env.VERCEL = "1";

  try {
    assert.equal(isProductionRuntime(), true);
  } finally {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }

    if (originalVercel === undefined) {
      delete process.env.VERCEL;
    } else {
      process.env.VERCEL = originalVercel;
    }
  }
});

test("errorHandler hides stack traces in Vercel runtime responses", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalVercel = process.env.VERCEL;

  delete process.env.NODE_ENV;
  process.env.VERCEL = "1";

  const error = new Error("Broken");
  error.statusCode = 400;
  let statusCode;
  let body;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      body = payload;
      return this;
    }
  };

  try {
    errorHandler(error, { originalUrl: "/test" }, res, () => {});

    assert.equal(statusCode, 400);
    assert.deepEqual(body, {
      success: false,
      message: "Broken"
    });
  } finally {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }

    if (originalVercel === undefined) {
      delete process.env.VERCEL;
    } else {
      process.env.VERCEL = originalVercel;
    }
  }
});
