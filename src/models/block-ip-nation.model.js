const mongoose = require("mongoose");
const NationSchema = mongoose.Schema(
  {
    code: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("nation", NationSchema);
