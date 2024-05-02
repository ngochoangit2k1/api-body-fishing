const mongoose = require("mongoose");
const IpSchema = mongoose.Schema(
  {
    ip: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ip", IpSchema);
