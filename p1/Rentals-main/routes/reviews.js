const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync");
const reviewsController = require("../controllers/reviews");
const { validateReview, validateObjectId } = require("../middleware/validate");

router.post(
  "/",
  validateObjectId("id"),
  validateReview,
  wrapAsync(reviewsController.createReview)
);

router.delete(
  "/:reviewId",
  validateObjectId(["id", "reviewId"]),
  wrapAsync(reviewsController.destroyReview)
);

module.exports = router;
