const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const listingsController = require("../controllers/listings");
const { validateListing, validateObjectId } = require("../middleware/validate");

router.route("/")
  .get(wrapAsync(listingsController.index))
  .post(validateListing, wrapAsync(listingsController.createListing));

router.get("/new", listingsController.renderNewForm);

router.route("/:id")
  .get(validateObjectId("id"), wrapAsync(listingsController.showListing))
  .put(validateObjectId("id"), validateListing, wrapAsync(listingsController.updateListing))
  .delete(validateObjectId("id"), wrapAsync(listingsController.destroyListing));

router.get("/:id/edit", validateObjectId("id"), wrapAsync(listingsController.renderEditForm));

module.exports = router;
