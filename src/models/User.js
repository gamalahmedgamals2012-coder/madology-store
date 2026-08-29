const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    address: {
      type: String,
      required: true,
      trim: true,
      maxlength: 250
    },
    addressDetails: {
      type: {
        city: {
          type: String,
          trim: true,
          default: ""
        },
        state: {
          type: String,
          trim: true,
          default: ""
        },
        country: {
          type: String,
          trim: true,
          default: ""
        },
        postalCode: {
          type: String,
          trim: true,
          default: ""
        }
      },
      default: undefined
    },
    latitude: {
      type: Number,
      default: null
    },
    longitude: {
      type: Number,
      default: null
    },
    phone: {
      type: String,
      trim: true,
      minlength: 7,
      maxlength: 30
    },
    addresses: {
      type: [
        {
          label: {
            type: String,
            trim: true,
            default: "Home"
          },
          address: {
            type: String,
            trim: true,
            maxlength: 250
          },
          latitude: {
            type: Number,
            default: null
          },
          longitude: {
            type: Number,
            default: null
          },
          isDefault: {
            type: Boolean,
            default: false
          }
        }
      ],
      default: []
    },
    wishlist: {
      type: [
        {
          productId: {
            type: String,
            trim: true,
            required: true
          },
          name: {
            type: String,
            trim: true,
            required: true
          },
          price: {
            type: Number,
            default: 0
          },
          image: {
            type: String,
            trim: true,
            default: ""
          },
          addedAt: {
            type: Date,
            default: Date.now
          }
        }
      ],
      default: []
    },
    reviews: {
      type: [
        {
          productId: {
            type: String,
            trim: true,
            required: true
          },
          rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
          },
          comment: {
            type: String,
            trim: true,
            default: ""
          },
          userName: {
            type: String,
            trim: true,
            default: ""
          },
          createdAt: {
            type: Date,
            default: Date.now
          }
        }
      ],
      default: []
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationToken: {
      type: String,
      default: null
    },
    verificationTokenExpires: {
      type: Date,
      default: null
    },
    passwordResetTokenHash: {
      type: String,
      default: null
    },
    passwordResetTokenExpiresAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);
