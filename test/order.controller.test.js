const test = require('node:test');
const assert = require('node:assert/strict');
const Order = require('../src/models/Order');
const { createOrder, normalizeCart, buildTrackingNumber, buildTrustedOrderItems, getIdempotencyKey, isDuplicateKeyError } = require('../src/controllers/order.controller');

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

test('getIdempotencyKey accepts a request header and validates its length', () => {
  assert.equal(getIdempotencyKey({ get: () => 'checkout-123' }), 'checkout-123');
  assert.throws(
    () => getIdempotencyKey({ get: () => 'x'.repeat(129) }),
    /Idempotency-Key must be 128 characters or fewer/
  );
});

test('isDuplicateKeyError only recognizes MongoDB unique-index collisions', () => {
  assert.equal(isDuplicateKeyError({ code: 11000 }), true);
  assert.equal(isDuplicateKeyError({ code: 121 }), false);
});

function invokeOrderController(req) {
  return new Promise((resolve) => {
    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(body) {
        resolve({ statusCode: this.statusCode, body });
        return this;
      }
    };

    createOrder(req, res, (error) => {
      throw error;
    });
  });
}

test('createOrder returns 201 after persistence and reuses a matching idempotency key', async () => {
  const originalFindOne = Order.findOne;
  const originalCreate = Order.create;
  const userId = '507f1f77bcf86cd799439011';
  const createdOrder = {
    _id: '507f1f77bcf86cd799439012',
    customer: { fullName: 'Mado User', phone: '123456789', address: 'Beni Suef, Egypt' },
    items: [{ productId: 'air-jordan', name: 'Air Jordan', size: 'M', color: 'Black', price: 650, quantity: 1, itemTotal: 650 }],
    totalAmount: 650,
    status: 'pending',
    trackingNumber: 'MADO-TEST-ABCDEF',
    createdAt: new Date()
  };

  const request = {
    user: { _id: userId, username: 'mado_user', name: 'Mado User', phone: '123456789', address: 'Beni Suef, Egypt' },
    get: () => 'checkout-key-1',
    body: {
      items: [{ id: 'air-jordan', name: 'Air Jordan', size: 'M', color: 'Black', price: 650, quantity: 1 }],
      customer: { phone: '123456789', address: 'Beni Suef, Egypt' }
    }
  };

  try {
    Order.findOne = async () => null;
    Order.create = async () => createdOrder;

    const createdResponse = await invokeOrderController(request);
    assert.equal(createdResponse.statusCode, 201);
    assert.equal(createdResponse.body.success, true);
    assert.equal(createdResponse.body.order.id, createdOrder._id);

    Order.findOne = async () => createdOrder;
    const retryResponse = await invokeOrderController(request);
    assert.equal(retryResponse.statusCode, 200);
    assert.equal(retryResponse.body.duplicate, true);
    assert.equal(retryResponse.body.order.id, createdOrder._id);
  } finally {
    Order.findOne = originalFindOne;
    Order.create = originalCreate;
  }
});
