const express = require("express");
const app = express();
const userRoutes = require("./routes/user");
const writerRoutes = require("./routes/writer");
const initRoutes = require("./routes/init");
const supabase = require("./utils/createClient");
const flash = require("connect-flash");
const session = require("express-session");
const csrf = require("csurf");
const csrfProtection = csrf();
const cookieParser = require("cookie-parser");

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

app.use("/", initRoutes);
app.use("/user", userRoutes);
app.use("/writer", writerRoutes);

app.listen(3000);
