const mongoose = require("mongoose");
const CountSchema = mongoose.Schema(
  {
    ip: {
      type: String,

    },
    socketId: {
        type: String,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("count", CountSchema);
