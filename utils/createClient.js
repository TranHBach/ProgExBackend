require("dotenv").config();
const supabaseJS = require("@supabase/supabase-js");
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = supabaseJS.createClient(supabaseUrl, supabaseKey);

module.exports = supabase;

