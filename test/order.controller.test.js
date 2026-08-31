const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeCart, buildTrackingNumber, buildTrustedOrderItems } = require('../src/controllers/order.controller');

test('normalizeCart keeps selected size and item total', () => {
  const normalized = normalizeCart([
    {
      id: 'product-1',
      name: 'Classic Tee',
      size: 'M',
      price: 15,
      quantity: 2,
      img: 'https://example.com/tee.png',
      itemTotal: 30
    }
  ]);

  assert.equal(normalized[0].size, 'M');
  assert.equal(normalized[0].itemTotal, 30);
  assert.equal(normalized[0].quantity, 2);
});

test('normalizeCart rejects items without a selected size', () => {
  assert.throws(() => normalizeCart([
    {
      id: 'product-2',
      name: 'Classic Tee',
      price: 15,
      quantity: 1,
      img: 'https://example.com/tee.png'
    }
  ]), /Selected size is required/);
});

test('buildTrackingNumber returns a stable MADOLOGY tracking format', () => {
  assert.match(buildTrackingNumber(), /^MADO-[A-Z0-9]+-[A-Z0-9]{6}$/);
});

test('buildTrustedOrderItems ignores tampered client prices', () => {
  const trustedItems = buildTrustedOrderItems([
    {
      id: 'air-jordan',
      name: 'Fake Name',
      size: 'M',
      color: 'Black',
      price: 1,
      quantity: 2,
      img: 'https://example.com/tampered.png'
    }
  ]);

  assert.equal(trustedItems[0].productId, 'air-jordan');
  assert.equal(trustedItems[0].name, 'Air Jordan');
  assert.equal(trustedItems[0].price, 650);
  assert.equal(trustedItems[0].itemTotal, 1300);
  assert.equal(trustedItems[0].img, '/ascets/clothes/Air jordan.jpeg');
});
