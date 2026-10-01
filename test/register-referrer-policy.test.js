const test = require("node:test");
const assert = require("node:assert/strict");

const app = require("../src/app");

test("registration page sends an origin referrer for map tiles only", async (t) => {
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));

  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const registerResponse = await fetch(`${baseUrl}/register.html`);
  const loginResponse = await fetch(`${baseUrl}/login.html`);

  assert.equal(
    registerResponse.headers.get("referrer-policy"),
    "strict-origin-when-cross-origin",
  );
  assert.equal(loginResponse.headers.get("referrer-policy"), "no-referrer");
});
