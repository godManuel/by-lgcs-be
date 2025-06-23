// Calling third-party packages
const swaggerUI = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");
const cors = require("cors");
const hpp = require("hpp");
const xss = require("xss-clean");
const helmet = require("helmet");
const express = require("express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "BY-LGCS-BE",
      version: "1.0.0",
      description:
        "A data capturing API for Bayelsa State Local Government Civil Service Commission",
    },
    servers: [
      {
        url: "http://localhost:8000",
      },
      {
        url: "https://by-lgcs-be.onrender.com",
      },
    ],
  },
  apis: ["./routes/*.js"],
};

const specs = swaggerJsDoc(options);

const app = express();
require("dotenv").config();

// Calling routes
const users = require("./routes/users");
const auth = require("./routes/auth");
const servants = require("./routes/servants");
const serviceAreas = require("./routes/serviceAreas");

// Calling built-in packages
const errorHandler = require("./middlewares/error");
const notFound = require("./middlewares/notFound");

// Assign PORT value
const PORT = process.env.PORT;

// import connectDB from "./config/db.js";
const connectDB = require("./config/db");
connectDB();

// CORS Middleware
app.use(cors());

// Express middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set security headers
app.use(helmet());

// Prevent XSS attacks
app.use(xss());

// Prevent HTTP Parameter attacks
app.use(hpp());

// Mount routes
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs));

app.use("/api/v1/users", users);

app.use("/api/v1/auth", auth);
app.use("/api/v1/civil-servants", servants);
app.use("/api/v1/service-areas", serviceAreas);

// Mount Built-in middlewares
app.use(notFound);
app.use(errorHandler);

// Server startup
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
