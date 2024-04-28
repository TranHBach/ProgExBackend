const supabase = require("../utils/createClient");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const jwtSecret = "seriuhgwo85ghwo8ty3n8vtyo5tywo8tvw3n8tywn38v57vywt";
const maxAge = 3 * 60 * 60;

const { validationResult } = require("express-validator");

exports.example = async (req, res, next) => {
  // console.log(req.body);
  // const { data, error } = await supabase.from("test_table").select();
  // if (error != null) {
  //   return res.status(500).json({
  //     message: "something wrong",
  //   });
  // }
  console.log(req.session);
  return res.status(200).json({ hi: "ok" });
};

exports.register = async (req, res, next) => {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(422).json({ validationErrors: error.array() });
  }
  const body = req.body;
  const Email = body.Email;
  const Password = body.Password;
  const FirstName = body.FirstName;
  const LastName = body.LastName;
  const Username = body.Username;

  bcrypt
    .hash(Password, 12)
    .then((hashedPassword) => {
      return supabase.from("Users").insert({
        Email: Email,
        Password: hashedPassword,
        FirstName: FirstName,
        LastName: LastName,
        Username: Username,
      });
    })
    .then((result) => {
      return res.status(200).json({ status: "ok" });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.login = async (req, res, next) => {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(422).json({ validationErrors: error.array() });
  }
  const body = req.body;
  const Password = body.Password;
  const Username = body.Username;
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
      bcrypt.compare(Password, hashedPassword).then((doMatch) => {
        if (doMatch) {
          const token = jwt.sign(
            {
              UserID: result.UserID,
              Password: hashedPassword,
              Username,
            },
            jwtSecret,
            { expiresIn: maxAge }
          );
          res.cookie("jwt", token, { maxAge: maxAge * 1000 });
          return res.status(200).json({ ...returnedUser, token: token });
        }
        return res.status(422).json({ message: "Incorrect Password" });
      });
    });
};

exports.logout = (req, res, next) => {
  res.clearCookie("jwt");
  return res.status(200).json({ message: "Logged out" });
};

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

exports.searchRecipe = async (req, res, next) => {
  console.log(req.body);
  const filterType = req.body.filterType;
  switch (filterType) {
    // Filter based on minimal ingredients
    case "1":
      const { allArticleID, err } = await supabase.from("have").select("*");
      if (err) {
        console.log(err);
        return res.status(422).json({ message: "Something went wrong" });
      }
      let missingCount = 0;
      for (let artiWithIngre in allArticleID) {
        console.log(artiWithIngre);
      }
      return res.status(200).json({message: "Bruh"});
    // Filter based on vote
    case "2":
      break;
    // Filter based on duration
    case "3":
      break;
    // Filter based on number of people per serving
    case "4":
      break;
    default:
      return res.status(422).json({ message: "No such filter" });
      break;
  }
};
