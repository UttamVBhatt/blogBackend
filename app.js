const express = require("express");

const app = express();

// Importing GlobalErrorHandler And AppError
const globalErrorHandler = require("./controllers/errorHandler");
const AppError = require("./utils/AppError");

// Importing Middlewares
const cookieParser = require("cookie-parser");
const cors = require("cors");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const helmet = require("helmet");

// Using Middlewares
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(mongoSanitize());
app.use(xss());
app.use(cookieParser());
app.use(cors());

// Importing Routers
const userRouter = require("./routes/userRouter");
const blogRouter = require("./routes/blogRoute");

// Using Routers
app.use("/api/v1/users", userRouter);
app.use("/api/v1/blogs", blogRouter);

// Error Handling For Non-Existent Route
app.all("*", (req, res, next) =>
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404))
);

// Using GloalErrorHandler
app.use(globalErrorHandler);

module.exports = app;
