const Listing = require("../models/listing.js");
const ExpressError = require("../utils/ExpressError.js");

module.exports.index = async (req, res) => {
  try {
    const alllisting = await Listing.find({}).maxTimeMS(5000);
    res.render("listings/index.ejs", { alllisting });
  } catch (err) {
    console.error("DB query failed for listings:", err.message);
    res.render("listings/index.ejs", { alllisting: [] });
  }
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id).populate("reviews");
  if (!listing) {
    throw new ExpressError(404, "Listing not found");
  }
  res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res) => {
  const newListing = new Listing(req.body.listing);
  await newListing.save();
  res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    throw new ExpressError(404, "Listing not found");
  }
  res.render("listings/edit.ejs", { listing });
};

module.exports.updateListing = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });
  if (!listing) {
    throw new ExpressError(404, "Listing not found to update");
  }
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  const { id } = req.params;
  const deletedListing = await Listing.findByIdAndDelete(id);
  if (!deletedListing) {
    throw new ExpressError(404, "Listing not found to delete");
  }
  console.log(`Deleted listing: ${deletedListing.title}`);
  res.redirect("/listings");
};
