const mongoose = require("mongoose");

// User schema مع validation أقوى
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,              // يمنع تكرار الإيميل
    lowercase: true,
    match: [/.+\@.+\..+/, "Please fill a valid email address"]
  },
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    minlength: [2, "Name must be at least 2 characters"]
  },
  address: {
    type: String,
    trim: true,
    default: ""
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
    trim: true
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"]
  }
}, { timestamps: true }); // يحفظ createdAt و updatedAt تلقائيًا

module.exports = mongoose.model("User", userSchema);
