const Listing = require("../models/listing.js");
const Review = require("../models/review.js");
const ExpressError = require("../utils/ExpressError.js");

module.exports.createReview = async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    throw new ExpressError(404, "Listing not found");
  }
  const newReview = new Review(req.body.review);
  listing.reviews.push(newReview._id);
  await newReview.save();
  await listing.save();
  res.redirect(`/listings/${listing._id}`);
};

module.exports.destroyReview = async (req, res) => {
  const { id, reviewId } = req.params;
  const listing = await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
  if (!listing) {
    throw new ExpressError(404, "Listing not found");
  }
  await Review.findByIdAndDelete(reviewId);
  res.redirect(`/listings/${id}`);
};
