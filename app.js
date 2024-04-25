require("dotenv").config();

const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const userRoutes = require("./routes/user");
const supabaseJS = require("@supabase/supabase-js");

const supabaseUrl = "https://zbpccdtnrjflweuxdzst.supabase.co";
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = supabaseJS.createClient(supabaseUrl, supabaseKey);

console.log(supabase)

app.use(bodyParser.urlencoded({ extended: false }));
app.use("/user", userRoutes);
app.listen(3000);
