const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");
const vm = require("node:vm");

function loadAuthReturn() {
  const source = fs.readFileSync("public/auth-return.js", "utf8");
  const window = {
    location: {
      origin: "https://mado.test",
      pathname: "/products.html",
      search: "?category=shirts",
      hash: "#new",
    },
  };
  vm.runInNewContext(source, { window, URL, encodeURIComponent });
  return window.MADOLOGY_AUTH_RETURN;
}

test("return URL accepts safe internal page state", () => {
  const helper = loadAuthReturn();
  assert.equal(
    helper.getSafeReturnUrl("products.html?category=shirts#new"),
    "products.html?category=shirts#new",
  );
  assert.match(helper.getRegisterUrl(), /^register\.html\?returnUrl=/);
});

test("return URL rejects external and executable destinations", () => {
  const helper = loadAuthReturn();
  assert.equal(helper.getSafeReturnUrl("https://evil.example/"), "");
  assert.equal(helper.getSafeReturnUrl("//evil.example/"), "");
  assert.equal(helper.getSafeReturnUrl("javascript:alert(1)"), "");
  assert.equal(helper.getSafeReturnUrl("register.html"), "");
});
