const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeCart } = require('../src/controllers/order.controller');

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
