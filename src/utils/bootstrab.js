import cors from "cors";
import env from "dotenv";
import { v1Router } from "./v1Router.js";
import { dbconnection } from "./dbconnection.js";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

env.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicPath = path.join(__dirname, "../../public");

export const bootstrap = async (app) => {
  // Handle CORS
  const corsConnfig = {
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Access-Control-Allow-Origin",
    ],
    credentials: true,
  };

  app.options("*", cors(corsConnfig));
  app.use(cors(corsConnfig));
  app.use(express.static(publicPath));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json()); // important for JSON payload

  // Test routes
  app.get("/", (req, res) => {
    res.send("welcome!");
  });

  app.get("/pp", (req, res) => {
    res.sendFile(path.join(publicPath, "pp.html"));
  });

  // API routes
  app.use("/api/v1/", v1Router);

  // Global Error Handler
  app.use((error, req, res, next) => {
    let status = error.status || 500;
    let message = error.message || "Internal Server Error";

    // MongoDB duplicate key error
    if (error.code === 11000) {
      status = 409; // Conflict
      const field = Object.keys(error.keyValue)[0];
      message = `Duplicate value for field: ${field}`;
    }

    res.status(status).json({ status, message });
  });

  // Connect DB & Start Server
  await dbconnection();
  app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
  });
};

