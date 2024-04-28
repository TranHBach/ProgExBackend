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

// Tested but may need to change later to make more sense
exports.searchRecipe = async (req, res, next) => {
  const { filterType, ingredientList } = req.body;
  let flavour = ["0"];
  if (req.body.flavour) {
    flavour = req.body.flavour;
  }
  let style = ["0"];
  if (req.body.style) {
    style = req.body.style;
  }
  ingredientList.sort();
  switch (filterType) {
    // Filter based on minimal ingredients
    case "1":
      supabase
        .from("Articles")
        .select()
        .contains("Flavour", flavour)
        .contains("Style", style)
        .overlaps("IngredientID", ingredientList)
        .order("TotalVote", { ascending: false })
        .then((response) => {
          const allArticleID = response.data;
          const err = response.err;
          if (err) {
            console.log(err);
            return res.status(422).json({ message: "Something went wrong" });
          }
          for (let i in allArticleID) {
            let artiWithIngre = allArticleID[i];
            const ingreListOfArticle = artiWithIngre.IngredientID;
            let missingCount = ingredientList.length;
            let m = 0;
            let n = 0;
            while (
              m < ingreListOfArticle.length &&
              n < ingredientList.length &&
              missingCount > 0
            ) {
              const mVal = ingreListOfArticle[m];
              const nVal = ingredientList[n];
              if (mVal == nVal) {
                missingCount--;
                m++;
                n++;
              } else if (mVal > nVal) {
                n++;
              } else if (mVal < nVal) {
                m++;
              }
            }
            allArticleID[i] = {
              ...allArticleID[i],
              missingCount: missingCount,
            };
          }
          allArticleID.sort((x, y) => {
            return x.missingCount - y.missingCount;
          });
          return res.status(200).json(allArticleID);
        });
    // Filter based on vote
    case "2":
      supabase
        .from("Articles")
        .select()
        .contains("Flavour", flavour)
        .contains("Style", style)
        .overlaps("IngredientID", ingredientList)
        .order("TotalVote", { ascending: false })
        .then((response) => {
          const allArticleID = response.data;
          const err = response.err;
          if (err) {
            console.log(err);
            return res.status(422).json({ message: "Something went wrong" });
          }
          return res.status(200).json(allArticleID);
        });

      break;
    // Filter based on duration
    case "3":
      supabase
        .from("Articles")
        .select()
        .contains("Flavour", flavour)
        .contains("Style", style)
        .overlaps("IngredientID", ingredientList)
        .order("Duration", { ascending: true })
        .order("TotalVote", { ascending: false })
        .then((response) => {
          const allArticleID = response.data;
          const err = response.err;
          if (err) {
            console.log(err);
            return res.status(422).json({ message: "Something went wrong" });
          }
          return res.status(200).json(allArticleID);
        });
      break;
    // Filter based on number of people per serving
    case "4":
      const { serving } = req.body;
      if (!serving) {
        return res.status(422).json({ message: "No serving input" });
      }
      supabase
        .from("Articles")
        .select()
        .eq("Serving", serving)
        .contains("Flavour", flavour)
        .contains("Style", style)
        .overlaps("IngredientID", ingredientList)
        .order("TotalVote", { ascending: false })
        .then((response) => {
          const allArticleID = response.data;
          const err = response.err;
          if (err) {
            console.log(err);
            return res.status(422).json({ message: "Something went wrong" });
          }
          return res.status(200).json(allArticleID);
        });
      break;
    default:
      return res.status(422).json({ message: "No such filter" });
  }
};
