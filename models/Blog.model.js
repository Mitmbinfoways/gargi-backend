const mongoose = require("mongoose");

const BlogSchema = new mongoose.Schema(
  {
    images: {
      type: [String],
    },
    title: {
      type: String,
      trim: true,
    },
    content: [
      {
        icon: {
          type: String,
        },
        title: {
          type: String,
        },
        description: {
          type: String,
        },
      },
    ],
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Blog", BlogSchema);
