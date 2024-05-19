require("dotenv").config(); // load our env variables

const express = require("express"); // import express (node.js)
const app = express(); // create an app instance
const mongoose = require("mongoose"); // connect to MongoDB via mongoose
const cors = require("cors"); // import cors library

mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true }); // connect to MongoDB

const db = mongoose.connection; // hold instance of db
db.on("error", (error) => console.error(error)); // log if error connecting to DB
db.once("open", () => console.log("Connected to Database")); // log if successful only once

app.use(
  // add cors to db
  cors({
    origin: "http://localhost:3001", // allowable web address
    methods: ["GET", "POST", "PATCH"], // allowable HTTP methods
  })
);

app.use(express.json()); // set up middleware to handle json

const streetRouter = require("./routes/street"); // create Street router
const regulationsRouter = require("./routes/regulation"); // create regulation router

streetRouter.use("/:streetId/regulations", regulationsRouter); // nest routers

app.use("/streets", streetRouter); // set up primary router

app.listen(3000, () => console.log("API Server Started on port 3000")); // start server on port 3000
