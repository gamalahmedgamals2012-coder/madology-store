const Order = require("../models/Order");
const { findProductById } = require("../data/products");
const productController = require("./product.controller");
const asyncHandler = require("../middleware/async.middleware");

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeCoordinate(value) {
  const coordinate = Number(value);
  return Number.isFinite(coordinate) ? coordinate : null;
}

function buildTrackingNumber() {
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `MADO-${Date.now().toString(36).toUpperCase()}-${randomPart}`;
}

function normalizeCart(cart) {
  if (!Array.isArray(cart) || cart.length === 0) {
    return [];
  }

  return cart.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw createError(`Cart item ${index + 1} is invalid.`, 400);
    }

    const normalizedItem = {
      productId: normalizeText(item.productId || item.id || item._id || item.sku),
      name: normalizeText(item.name || item.productName || item.title),
      size: normalizeText(item.size || item.selectedSize),
      color: normalizeText(item.color || item.selectedColor),
      price: Number(item.price),
      quantity: Number(item.quantity),
      img: normalizeText(item.img || item.image),
      itemTotal: Number(item.price) * Number(item.quantity)
    };

    if (!normalizedItem.productId) {
      throw createError(`Product ID is required for cart item ${index + 1}.`, 400);
    }

    if (!normalizedItem.name) {
      throw createError(`Product name is required for cart item ${index + 1}.`, 400);
    }

    if (!normalizedItem.size) {
      throw createError(`Selected size is required for cart item ${index + 1}.`, 400);
    }

    if (!Number.isFinite(normalizedItem.price) || normalizedItem.price < 0) {
      throw createError(`Valid price is required for cart item ${index + 1}.`, 400);
    }

    if (!Number.isInteger(normalizedItem.quantity) || normalizedItem.quantity < 1) {
      throw createError(`Valid quantity is required for cart item ${index + 1}.`, 400);
    }

    return normalizedItem;
  });
}

function buildTrustedOrderItems(cart) {
  const normalizedItems = normalizeCart(cart);

  return normalizedItems.map((item, index) => {
    const product = findProductById(item.productId);

    if (!product) {
      throw createError(`Product ${index + 1} is no longer available.`, 400);
    }

    const productSize = product.sizes.some((size) => normalizeText(size).toLowerCase() === item.size.toLowerCase());

    if (!productSize) {
      throw createError(`Selected size is invalid for cart item ${index + 1}.`, 400);
    }

    const selectedColor = item.color || "Default";
    const colorMatches = !item.color
      || item.color === "Default"
      || product.colors.some((color) => normalizeText(color).toLowerCase() === item.color.toLowerCase());

    if (!colorMatches) {
      throw createError(`Selected color is invalid for cart item ${index + 1}.`, 400);
    }

    const trustedPrice = Number(product.price);

    return {
      productId: product.id,
      name: product.displayName || product.name,
      size: item.size,
      color: selectedColor,
      price: trustedPrice,
      quantity: item.quantity,
      img: product.image || item.img || "",
      itemTotal: trustedPrice * item.quantity
    };
  });
}

function buildCustomerSnapshot(req, user) {
  const customerPayload = req.body.customer || {};
  const fullName = normalizeText(customerPayload.fullName || customerPayload.name || req.body.customerName || user.name);
  const phone = normalizeText(customerPayload.phone || req.body.customerPhone || req.body.phone || user.phone);
  const address = normalizeText(customerPayload.address || req.body.customerAddress || req.body.address || user.address);
  const email = normalizeText(customerPayload.email || user.email).toLowerCase();
  const latitude = normalizeCoordinate(customerPayload.latitude ?? req.body.latitude ?? user.latitude);
  const longitude = normalizeCoordinate(customerPayload.longitude ?? req.body.longitude ?? user.longitude);

  if (!fullName) {
    throw createError("Customer full name is required.", 400);
  }

  if (!phone) {
    throw createError("Customer phone number is required.", 400);
  }

  if (!address) {
    throw createError("Customer full address is required.", 400);
  }

  return {
    fullName,
    phone,
    address,
    latitude,
    longitude,
    email
  };
}

const createOrder = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Please log in first."
    });
  }

  const normalizedItems = buildTrustedOrderItems(req.body.cart || req.body.items);

  if (normalizedItems.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Cart cannot be empty."
    });
  }

  const customer = buildCustomerSnapshot(req, user);
  const totalAmount = normalizedItems.reduce((sum, item) => sum + item.itemTotal, 0);

  const order = await Order.create({
    user: user._id,
    customer,
    items: normalizedItems,
    totalAmount,
    trackingNumber: buildTrackingNumber(),
    statusHistory: [{ status: "pending", note: "Order received" }]
  });

  res.status(201).json({
    success: true,
    message: "Order placed successfully.",
    order: {
      id: order._id,
      customer: order.customer,
      items: order.items,
      totalAmount: order.totalAmount,
      status: order.status,
      trackingNumber: order.trackingNumber,
      createdAt: order.createdAt
    }
  });
});

const getOrderHistory = asyncHandler(async (req, res) => {
  const user = req.user;
  const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 });

  res.json({
    success: true,
    orders: orders.map((order) => ({
      id: order._id,
      customer: order.customer,
      items: order.items,
      totalAmount: order.totalAmount,
      status: order.status,
      trackingNumber: order.trackingNumber,
      statusHistory: order.statusHistory,
      createdAt: order.createdAt
    }))
  });
});

const getOrderTracking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await Order.findOne({ _id: id, user: req.user._id });

  if (!order) {
    throw createError("Order not found.", 404);
  }

  res.json({
    success: true,
    order: {
      id: order._id,
      status: order.status,
      trackingNumber: order.trackingNumber,
      statusHistory: order.statusHistory,
      createdAt: order.createdAt
    }
  });
});

const addReview = productController.submitReview;

module.exports = {
  createOrder,
  normalizeCart,
  buildTrackingNumber,
  buildTrustedOrderItems,
  getOrderHistory,
  getOrderTracking,
  addReview
};
