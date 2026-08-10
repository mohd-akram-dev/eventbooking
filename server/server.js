const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const dns = require("node:dns/promises");

dotenv.config();

// Some local ISPs fail to resolve MongoDB Atlas SRV records, so we force a
// public resolver in development. Hosting platforms provide a working resolver
// of their own, and overriding it there breaks the Mongo connection.
if (process.env.NODE_ENV !== "production") {
  dns.setServers(["1.1.1.1", "1.0.0.1"]);
}

const authRoutes = require("./routes/auth");
const eventRoutes = require("./routes/events");
const bookingRoutes = require("./routes/bookings");

const app = express();

// Middleware
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser clients (curl, Postman) which send no Origin header.
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`Not allowed by CORS: ${origin}`));
    },
  })
);
app.use(express.json());

// Health check, also used to keep the free-tier instance warm
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/bookings", bookingRoutes);

// Database Connection
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/eventora")
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
