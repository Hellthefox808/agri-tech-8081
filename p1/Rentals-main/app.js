if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");

const Listing = require("./models/listing.js");
const ExpressError = require("./utils/ExpressError.js");
const listingsRouter = require("./routes/listings.js");
const reviewsRouter = require("./routes/reviews.js");

const dbUrl = process.env.MONGODB_URI;
if (!dbUrl) {
  console.error("CRITICAL: MONGODB_URI environment variable is not defined!");
  process.exit(1);
}

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log("DB connection error:", err.message);
  });

async function main() {
  await mongoose.connect(dbUrl);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Security Headers (Helmet)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: [],
        connectSrc: ["'self'"],
        scriptSrc: ["'unsafe-inline'", "'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        workerSrc: ["'self'", "blob:"],
        objectSrc: [],
        imgSrc: [
          "'self'",
          "blob:",
          "data:",
          "https://images.unsplash.com",
        ],
        fontSrc: ["'self'"],
      },
    },
  })
);

// Payload Size Limits (Mitigate LDoS)
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ limit: "10kb", extended: true }));

// Override method
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

// Anti-NoSQL Injection Sanitization
app.use(mongoSanitize());

// Global Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: "Too many requests from this IP, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter Rate Limiting for Mutation Routes
const mutationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: "Too many listings or reviews created from this IP, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/listings", globalLimiter);
app.use("/listings/:id/reviews", mutationLimiter);

// Home Route
app.get("/", async (req, res) => {
  try {
    const alllisting = await Listing.find({}).maxTimeMS(5000);
    res.render("home.ejs", { alllisting });
  } catch (err) {
    console.error("DB query failed for home page:", err.message);
    res.render("home.ejs", { alllisting: [] });
  }
});

// Routers
app.use("/listings", listingsRouter);
app.use("/listings/:id/reviews", reviewsRouter);

// Test Listing Route (Preserved for backward compatibility)
app.get("/testListing", mutationLimiter, async (req, res) => {
  try {
    const sampleListing = new Listing({
      title: "My New Villa",
      description: "By the beach",
      price: 1200,
      location: "Calangute, Goa",
      country: "India",
    });
    await sampleListing.save();
    console.log("sample was saved");
    res.send("Successfully testing");
  } catch (err) {
    res.status(500).send("Test listing generation failed");
  }
});

// 404 Handler
app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});

// Global Error Handler
app.use((err, req, res, next) => {
  const { statusCode = 500, message = "Something Went Wrong" } = err;
  res.status(statusCode).render("error.ejs", { message: String(message).slice(0, 100) });
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server is listening to port ${port}`);
});