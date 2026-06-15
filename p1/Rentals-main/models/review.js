const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const reviewSchema = new Schema(
  {
    comment: {
      type: String,
      required: [true, "Comment cannot be empty"],
      trim: true,
      maxLength: [500, "Comment cannot exceed 500 characters"],
    },

    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
  },
  {
    timestamps: true, // automatically adds createdAt and updatedAt
  }
);

const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;