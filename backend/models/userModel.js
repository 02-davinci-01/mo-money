const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  owner: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  pin: {
    type: String,
    required: true,
  },
  movements: {
    type: [Number],
    default: [],
  },
  interestRate: {
    type: Number,
    default: 1.0,
  },
  movementsDates: {
    type: [String],
    default: [],
  },
  categories: {
    type: [String],
    default: [],
  },
  currency: {
    type: String,
    default: "INR",
  },
  locale: {
    type: String,
    default: "en-IN",
  },
  balance: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  needsPhoneVerification: {
    // Added for 2FA
    type: Boolean,
    default: false,
  },
  firebaseUid: {
    // Added to store Firebase UID
    type: String,
    required: false, // Make it false initially.  Set it when phone is verified.
    unique: true, //  Ensure uniqueness if you are using it as primary key
  },
});

// Pre-save hook to calculate balance
userSchema.pre("save", function (next) {
  if (this.movements && this.movements.length > 0) {
    this.balance = this.movements.reduce((acc, mov) => acc + mov, 0);
  }
  next();
});

module.exports = mongoose.model("User", userSchema);
