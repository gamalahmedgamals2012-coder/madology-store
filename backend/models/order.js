const mongoose = require("mongoose");

// Order schema محسّن
const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",      // يربط الطلب بالـ User
    required: true
  },
  items: [
    {
      productId: String,
      name: String,
      quantity: { type: Number, default: 1 },
      price: Number
    }
  ],
  status: {
    type: String,
    enum: ["pending", "completed", "cancelled"],
    default: "pending"
  },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
