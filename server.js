const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const enquirRoutes = require("./routes/enquiryRoutes");
const authRoutes = require("./routes/authRoutes");
const fs = require("fs");
const path = require("path");
dotenv.config();

const app = express();

const allowedOrigins = [
  "http://localhost:5173", 
  "https://your-frontend-domain.com",
  "http://10.57.1.69:5173"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE","PATCH"],
    credentials: true,
  })
);
connectDB();

app.use(express.json());
app.use("/assets", express.static("public/assets"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/enquiries", enquirRoutes);
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
