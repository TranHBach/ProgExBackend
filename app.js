const path = require("path");
const fs = require("fs");
const express = require("express");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const userRoutes = require("./routes/user");
const writerRoutes = require("./routes/writer");
const initRoutes = require("./routes/init");
const supabase = require("./utils/createClient");
const cloudinary = require("./utils/cloudinary");

const app = express();
app.use(fileUpload());
app.use(express.static("public"));

app.use((req, res, next) => {
  res.set({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS, GET, POST, PUT, PATCH, DELETE",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  return res.render("index");
});
app.use("/", initRoutes);
app.use("/user", userRoutes);
app.use("/writer", writerRoutes);

app.listen(3000);
