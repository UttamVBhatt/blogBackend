const app = require("./app");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config({ path: "./config.env" });

process.on("uncaughtException", (err) => {
  console.log("Uncaught Exception, Shutting Down");
  console.log(err.message, err.stack, err);
  process.exit(1);
});

const port = process.env.PORT;
const DB = process.env.DATABASE;

mongoose
  .connect(DB, {
    dbName: "Blog",
  })
  .then(() => console.log("Database is connected"))
  .catch((err) => console.log(err));

const server = app.listen(port, () => {
  console.log(`Server is running on port : ${port}`);
});

process.on("unhandledRejection", (err) => {
  console.log("Unhandled Rejection, Shutting Down");
  console.log(err.stack, err.message, err);
  server.close(() => {
    process.exit(1);
  });
});
