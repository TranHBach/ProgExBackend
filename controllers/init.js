const jwt = require("jsonwebtoken");
const jwtSecret = require("../utils/jwtSecret");
const supabase = require("../utils/createClient");

exports.init = (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) {
    return res.status(300).json({ message: "Token not found" });
  }
  jwt.verify(token, jwtSecret, (err, decodedToken) => {
    if (err) {
      return res.status(422).json({ message: "Token expired" });
    }
    const Username = decodedToken.Username;
    const Password = decodedToken.Password;
    supabase
      .from("Users")
      .select()
      .eq("Username", Username)
      .limit(1)
      .then((result) => {
        if (result.data.length == 0) {
          return res.status(422).json({ message: "User not found" });
        }
        const returnedUser = result.data[0];
        const hashedPassword = returnedUser.Password;
        if (Password == hashedPassword) {
          return res.status(200).json({ ...returnedUser });
        }
        return res.status(422).json({ message: "Incorrect Password" });
      });
  });
};

exports.getEverything = async (req, res, next) => {
  try {
    const { data: styles, error: stylesError } = await supabase
      .from("Style")
      .select("*");

    const { data: ingredients, error: ingredientsError } = await supabase
      .from("Ingredients")
      .select("*");

    const { data: flavours, error: flavoursError } = await supabase
      .from("Flavour")
      .select("*");

    const { data: course, error: courseError } = await supabase
      .from("Course")
      .select("*");

    if (stylesError || ingredientsError || flavoursError || courseError) {
      console.error("Error:", stylesError || ingredientsError || flavoursError || courseError);
      return res.status(500).json({ success: false, error: "Server error" });
    }

    return res
      .status(200)
      .json({ success: true, data: { styles, ingredients, flavours, course } });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

exports.logout = (req, res, next) => {
  res.setHeader('set-cookie', 'jwt=; max-age=0');
  return res.status(200).json({ message: "Logged out" });
};
