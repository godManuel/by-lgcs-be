const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema(
  {
    serviceRegion: {
      type: String,
      required: true,
    },
    serviceArea: {
      type: String,
      required: true,
    },
    sequence: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

// One counter per serviceRegion + serviceArea
counterSchema.index({ serviceRegion: 1, serviceArea: 1 }, { unique: true });

module.exports = mongoose.model("Counter", counterSchema);
