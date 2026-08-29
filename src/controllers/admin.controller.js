const User = require("../models/User");
const Order = require("../models/Order");
const asyncHandler = require("../middleware/async.middleware");

const ORDER_STATUSES = ["pending", "processing", "confirmed", "shipped", "delivered", "completed", "cancelled"];

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find()
    .select("-password -verificationToken -passwordResetTokenHash -passwordResetTokenExpiresAt")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: users.length,
    users
  });
});

const listOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .select("-__v")
    .populate("user", "name email phone address latitude longitude")
    .sort({ createdAt: -1 })
    .lean();

  const normalizedOrders = orders.map((order) => {
    const user = order.user || {};
    const customerAddress = user.address || order.customer?.address || "";
    const customerLatitude = user.latitude ?? order.customer?.latitude ?? null;
    const customerLongitude = user.longitude ?? order.customer?.longitude ?? null;

    return {
      ...order,
      customer: order.customer || {
        fullName: user.name || "",
        phone: user.phone || "",
        address: customerAddress,
        latitude: customerLatitude,
        longitude: customerLongitude,
        email: user.email || ""
      }
    };
  });

  res.json({
    success: true,
    count: normalizedOrders.length,
    orders: normalizedOrders
  });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note, trackingNumber } = req.body;

  if (!ORDER_STATUSES.includes(status)) {
    throw createError("A valid order status is required.", 400);
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    throw createError("Order not found.", 404);
  }

  order.status = status;

  if (trackingNumber !== undefined) {
    order.trackingNumber = String(trackingNumber || "").trim() || order.trackingNumber;
  }

  order.statusHistory.push({
    status,
    note: String(note || "").trim()
  });

  await order.save();

  res.json({
    success: true,
    message: "Order status updated successfully.",
    order: {
      id: order._id,
      status: order.status,
      trackingNumber: order.trackingNumber,
      statusHistory: order.statusHistory,
      updatedAt: order.updatedAt
    }
  });
});

module.exports = {
  listUsers,
  listOrders,
  updateOrderStatus
};
