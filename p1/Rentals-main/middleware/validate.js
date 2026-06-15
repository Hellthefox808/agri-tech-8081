const mongoose = require("mongoose");
const ExpressError = require("../utils/ExpressError.js");
const { listingSchema, reviewSchema } = require("../schema.js");

// Validate Listing Body
module.exports.validateListing = (req, res, next) => {
  const { error } = listingSchema.validate(req.body, { abortEarly: false, allowUnknown: false });
  if (error) {
    const errMsg = error.details.map((el) => el.message).join(", ");
    throw new ExpressError(400, errMsg);
  } else {
    next();
  }
};

// Validate Review Body
module.exports.validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body, { abortEarly: false, allowUnknown: false });
  if (error) {
    const errMsg = error.details.map((el) => el.message).join(", ");
    throw new ExpressError(400, errMsg);
  } else {
    next();
  }
};

// Validate MongoDB ObjectId in req.params
module.exports.validateObjectId = (paramNames) => {
  return (req, res, next) => {
    const paramsToCheck = Array.isArray(paramNames) ? paramNames : [paramNames];
    for (const param of paramsToCheck) {
      const id = req.params[param];
      if (id && !mongoose.Types.ObjectId.isValid(id)) {
        throw new ExpressError(400, `Invalid ID format for parameter: ${param}`);
      }
    }
    next();
  };
};
