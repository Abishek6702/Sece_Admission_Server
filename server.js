const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const enquirRoutes = require("./routes/enquiryRoutes");
const authRoutes = require("./routes/authRoutes");
const fs = require("fs");
const path = require("path");
dotenv.config();

const app = express();

// Connection establishmant to mongodb
connectDB();

// Middleware to parse json
app.use(express.json());
// all the app routes
app.use("/assets", express.static("public/assets"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/enquiries",enquirRoutes);
app.use("/api/auth",authRoutes);


const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
