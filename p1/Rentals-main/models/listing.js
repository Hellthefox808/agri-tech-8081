const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js"); 

const listingSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"], 
      trim: true,                            
    },

    description: {
      type: String,
      trim: true,
    },

    image: {
      type: String,
      default: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4", 
      set: (v) =>
        v === "" || v === null || v === undefined
          ? "https://images.unsplash.com/photo-1506905925346-21bda4d32df4" 
          : v,
    },

    price: {
      type: Number,
      min: [0, "Price cannot be negative"], 
    },

    location: {
      type: String,
      trim: true,
    },

    country: {
      type: String,
      trim: true,
    },

    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
  },
  {
    timestamps: true, 
  }
);

listingSchema.post("findOneAndDelete", async (listing) => {
  if (listing && listing.reviews.length > 0) {
    await Review.deleteMany({ _id: { $in: listing.reviews } });
    console.log("Associated reviews deleted.");
  }
});


const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;