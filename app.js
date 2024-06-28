const path = require("path");
const fs = require("fs");
const express = require("express");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const session = require("express-session");
const userRoutes = require("./routes/user");
const writerRoutes = require("./routes/writer");
const initRoutes = require("./routes/init");
const supabase = require("./utils/createClient");
const cloudinary = require("./utils/cloudinary");

const app = express();
app.use(fileUpload());
app.use(express.static("public"));

// app.use((req, res, next) => {
//   res.append("Access-Control-Allow-Origin", ["*"]);
//   res.append("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS");
//   res.append("Access-Control-Allow-Headers", "Content-Type");
//   res.append("Access-Control-Allow-Credentials", true);
//   next();
// });
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: false,
    cookie: {
      sameSite: "none",
      secure: true
    }
  })
);

app.use(
  cors({
    origin: "https://cooking123.netlify.app",
    credentials: true,
    allowedHeaders: "Content-Type",
    methods: "GET, POST, PATCH, PUT, DELETE, OPTIONS"
  })
);

app.use(function (req, res, next) {
  res.header("Content-Type", "application/json;charset=UTF-8");
  res.header("Access-Control-Allow-Credentials", true);
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
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
