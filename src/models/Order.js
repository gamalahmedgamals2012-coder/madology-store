const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    size: {
      type: String,
      required: true,
      trim: true
    },
    color: {
      type: String,
      trim: true,
      default: ""
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    img: {
      type: String,
      trim: true,
      default: ""
    },
    itemTotal: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { _id: false }
);

const customerSnapshotSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      required: true,
      trim: true
    },
    latitude: {
      type: Number,
      default: null
    },
    longitude: {
      type: Number,
      default: null
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    customer: {
      type: customerSnapshotSchema,
      required: true
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length > 0;
        },
        message: "Order must contain at least one item."
      }
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    trackingNumber: {
      type: String,
      trim: true,
      default: null
    },
    // A client-generated key makes a retry of the same checkout safe.
    // It is deliberately scoped to the customer so separate users may use
    // the same key without colliding.
    idempotencyKey: {
      type: String,
      trim: true,
      maxlength: 128,
      default: null
    },
    statusHistory: {
      type: [
        {
          status: {
            type: String,
            required: true,
            trim: true
          },
          note: {
            type: String,
            trim: true,
            default: ""
          },
          timestamp: {
            type: Date,
            default: Date.now
          }
        }
      ],
      default: []
    },
    status: {
      type: String,
      enum: ["pending", "processing", "confirmed", "shipped", "delivered", "completed", "cancelled"],
      default: "pending"
    }
  },
  {
    timestamps: true
  }
);

orderSchema.index(
  { user: 1, idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: "string" } }
  }
);

module.exports = mongoose.model("Order", orderSchema);
