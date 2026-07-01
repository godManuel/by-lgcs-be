// Third-party modules
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const validator = require("validator");
// const serviceAreas = require("../config/serviceAreas");

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: {
    type: String,
    unique: true,
    required: true,
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  password: {
    type: String,
    // match: [
    //   /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/,
    //   "Password must be 8 characters or more with a combination of letters and numbers",
    // ],
    select: false,
    required: true,
  },
  role: {
    type: String,
    enum: ["superadmin", "admin"],
    required: true,
    default: "admin",
  },
  assignedRDAs: {
    type: [String],
    // validate: {
    //   validator: function (v) {
    //     if (this.assignedLGAs.length === 0) {
    //       return v && v.length > 0; // Array should not be empty
    //     }
    //     return true;
    //   },
    //   message: "assignedRDAs must contain at least one value!",
    // },
  },
  assignedLGAs: {
    type: [String],
    // validate: {
    //   validator: function (v) {
    //     if (this.assignedRDAs.length === 0) {
    //       return v && v.length > 0; // Array should not be empty
    //     }
    //     return true;
    //   },
    //   message: "assignedLGAs must contain at least one value!",
    // },
  },
  statistics: {
    totalServants: {
      type: Number,
      default: 0,
    },

    totalDrafts: {
      type: Number,
      default: 0,
    },

    completedServants: {
      type: Number,
      default: 0,
    },

    totalDocumentsUploaded: {
      type: Number,
      default: 0,
    },
  },
  emailOTP: String,
  emailOTPExpire: Date,
});

/* TASK -> Encrypt user password */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

/* TASK -> Sign user token */
userSchema.methods.getSignedToken = function () {
  return jwt.sign(
    {
      id: this.id,
      email: this.email,
      role: this.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRY,
    },
  );
};

/* TASK -> Match req.body.password to user password */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/* TASK -> Generate user OTP for Email Verification */
const OTP_EXPIRY_MINUTES = 5;

userSchema.methods.getEmailOTP = async function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const salt = await bcrypt.genSalt(10);
  this.emailOTP = await bcrypt.hash(otp, salt);

  this.emailOTPExpire = Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000;

  return otp;
};

/* TASK -> Compare emailOTP with req.body.emailOTP  */
userSchema.methods.verifyEmailOTP = async function (enteredOTP) {
  return await bcrypt.compare(enteredOTP, this.emailOTP);
};

module.exports = mongoose.model("User", userSchema);
