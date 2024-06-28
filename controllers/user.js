require("dotenv").config();
const supabase = require("../utils/createClient");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const jwtSecret = require("../utils/jwtSecret");
const nodemailer = require("nodemailer");
const fetch = require("node-fetch");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const maxAge = 30 * 24 * 60 * 60;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
const { validationResult } = require("express-validator");

exports.example = async (req, res, next) => {
  // console.log(req.body);
  // const { data, error } = await supabase.from("test_table").select();
  // if (error != null) {
  //   return res.status(500).json({
  //     message: "something wrong",
  //   });
  // }
  const token = req.cookies.jwt;
  if (!token) {
    return res.status(300).json({ message: "Token not found" });
  }
  let val = jwt.verify(token, jwtSecret);

  console.log(val);
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
      supabase
        .from("Users")
        .insert({
          Email: Email,
          Password: hashedPassword,
          FirstName: FirstName,
          LastName: LastName,
          Username: Username,
        })
        .select()
        .then((result) => {
          const returnedUser = result.data[0];
          const token = jwt.sign(
            {
              UserID: returnedUser.UserID,
              Password: hashedPassword,
              Username: Username,
            },
            jwtSecret,
            { expiresIn: maxAge }
          );
          res.cookie("jwt", token, {
            maxAge: maxAge * 1000,
            httpOnly: true,
            secure: true,
            sameSite: "none",
          });
          return res.status(200).json({ ...returnedUser, token: token });
        })
        .catch((err) => {
          console.log(err);
          return res.status(422).json({ message: "error" });
        });
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
              UserID: returnedUser.UserID,
              Password: hashedPassword,
              Username,
            },
            jwtSecret,
            { expiresIn: maxAge }
          );
          res.cookie("jwt", token, {
            maxAge: maxAge * 1000,
            httpOnly: true,
            secure: true,
            sameSite: "none",
          });
          return res.status(200).json({ ...returnedUser, token: token });
        }
        return res.status(422).json({ message: "Incorrect Password" });
      });
    });
};

exports.logout = (req, res, next) => {
  res.clearCookie("jwt");
  // res.cookie("jwt", "", {maxAge: 0})
  res.end();
  return res.status(200).json({ message: "Logged out" });
};

// Tested but may need to change later to make more sense
exports.searchRecipe = async (req, res, next) => {
  const error = validationResult(req);
  if (!error.isEmpty()) {
    return res.status(422).json({ validationErrors: error.array() });
  }
  const { filterType, ingredientList } = req.body;
  let flavour = [0];
  if (req.body.flavour) {
    flavour = req.body.flavour;
  }
  let style = [0];
  if (req.body.style) {
    style = req.body.style;
  }
  let course = [0];
  if (req.body.course) {
    course = req.body.course;
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
        .contains("Course", course)
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
      break;
    // Filter based on vote
    case "2":
      supabase
        .from("Articles")
        .select()
        .contains("Flavour", flavour)
        .contains("Style", style)
        .contains("Course", course)
        .overlaps("IngredientID", ingredientList)
        .order("TotalVote", { ascending: false })
        .then((response) => {
          const allArticleID = response.data;
          const err = response.err;
          if (err) {
            console.log(err);
            return res.status(422).json({ message: "Something went wrong" });
          } else {
            return res.status(200).json(allArticleID);
          }
        });

      break;
    // Filter based on duration
    case "3":
      supabase
        .from("Articles")
        .select()
        .contains("Flavour", flavour)
        .contains("Style", style)
        .contains("Course", course)
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
        .contains("Course", course)
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

exports.updateUserInfo = async (req, res, next) => {
  const validateErr = validationResult(req);
  if (!validateErr.isEmpty()) {
    return res.status(422).json({ validationErrors: validateErr.array() });
  }

  const token = req.cookies.jwt;
  if (!token) {
    return res.status(300).json({ message: "Token not found" });
  }
  let val = jwt.verify(token, jwtSecret);
  const UserID = val.UserID;
  const { FirstName, LastName, Email } = req.body;
  const { error } = await supabase
    .from("Users")
    .update({ FirstName, LastName, Email })
    .eq("UserID", UserID);

  if (error) {
    return res.status(500).json({ success: false, error: "Database error" });
  }
  return res.status(200).json({ message: true });
};

exports.updatePassword = async (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) {
    return res.status(300).json({ message: "Token not found" });
  }
  let val = jwt.verify(token, jwtSecret);
  const UserID = val.UserID;
  const { oldPassword, newPassword, confirmNewPassword } = req.body;
  supabase
    .from("Users")
    .select()
    .eq("UserID", UserID)
    .limit(1)
    .then((result) => {
      if (result.data.length == 0) {
        return res.status(422).json({ message: "User not found" });
      }
      const returnedUser = result.data[0];
      const hashedPassword = returnedUser.Password;
      bcrypt.compare(oldPassword, hashedPassword).then((doMatch) => {
        if (doMatch) {
          bcrypt
            .hash(newPassword, 12)
            .then((newHashedPassword) => {
              const token = jwt.sign(
                {
                  UserID: UserID,
                  Password: newHashedPassword,
                  Username: returnedUser.Username,
                },
                jwtSecret,
                { expiresIn: maxAge }
              );
              supabase
                .from("Users")
                .update({
                  Password: newHashedPassword,
                })
                .eq("UserID", UserID)
                .then((response) => {
                  res.cookie("jwt", token, {
                    maxAge: maxAge * 1000,
                    httpOnly: true,
                    secure: true,
                    sameSite: "none",
                  });
                  return res
                    .status(200)
                    .json({ ...returnedUser, token: token });
                });
            })
            .catch((err) => {
              console.log(err);
            });
        } else {
          return res.status(422).json({ message: "Incorrect Password" });
        }
      });
    });
};

exports.updateUsername = async (req, res, next) => {
  const validateErr = validationResult(req);
  if (!validateErr.isEmpty()) {
    return res.status(422).json({ validationErrors: validateErr.array() });
  }

  const token = req.cookies.jwt;
  if (!token) {
    return res.status(300).json({ message: "Token not found" });
  }
  let val = jwt.verify(token, jwtSecret);
  const UserID = val.UserID;
  const { Username } = req.body;
  const { error } = await supabase
    .from("Users")
    .update({ Username })
    .eq("UserID", UserID);

  if (error) {
    return res.status(500).json({ success: false, error: "Database error" });
  }
  return res.status(200).json({ message: true });
};

exports.getOneArticle = async (req, res, next) => {
  const validateErr = validationResult(req);
  if (!validateErr.isEmpty()) {
    return res.status(422).json({ validationErrors: validateErr.array() });
  }

  const ArticleID = req.body.ArticleID;
  const { data, err } = await supabase
    .from("Articles")
    .select()
    .eq("ArticleID", ArticleID);
  if (err) {
    return res.status(422).json({ message: "Database error" });
  }
  return res.status(200).json(data);
};

exports.sendOTP = async (req, res, next) => {
  const validateErr = validationResult(req);
  if (!validateErr.isEmpty()) {
    return res.status(422).json({ validationErrors: validateErr.array() });
  }

  const { Email } = req.body;
  const OTP = Math.floor(100000 + Math.random() * 900000);
  supabase
    .from("OTP")
    .upsert({ Email, OTP })
    .then((response) => {
      if (response.error) {
        return res.status(422).json(response.error);
      } else {
        var transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 465,
          send: true,
          auth: {
            user: process.env.EMAIL,
            pass: process.env.APP_PASS,
          },
        });

        var mailOptions = {
          from: "Tran Huu Bach",
          to: Email,
          subject: `OTP Code`,
          text: `Your OTP is ${OTP}`,
        };

        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log("Email sent: " + info.response);
            return res.status(200).json({ message: "Please check your email" });
          }
        });
      }
    });
};

exports.resetPassword = async (req, res, next) => {
  const validateErr = validationResult(req);
  if (!validateErr.isEmpty()) {
    return res.status(422).json({ validationErrors: validateErr.array() });
  }

  const { OTP, Email, Password } = req.body;
  supabase
    .from("OTP")
    .select()
    .eq("Email", Email)
    .eq("OTP", OTP)
    .then((result) => {
      if (result.count == 0) {
        return res.status(200).json({ message: "Wrong OTP" });
      } else {
        bcrypt
          .hash(Password, 12)
          .then((hashedPassword) => {
            supabase
              .from("Users")
              .update({
                Password: hashedPassword,
              })
              .eq("Email", Email)
              .then((result) => {
                return res
                  .status(200)
                  .json({ message: "Password has successfully changed." });
              })
              .catch((err) => {
                console.log(err);
                return res.status(422).json({ message: "error" });
              });
          })
          .catch((err) => {
            console.log(err);
          });
      }
    });
};

exports.likeArticle = async (req, res, next) => {
  const validateErr = validationResult(req);
  if (!validateErr.isEmpty()) {
    return res.status(422).json({ validationErrors: validateErr.array() });
  }
  const token = req.cookies.jwt;
  if (!token) {
    return res.status(300).json({ message: "Token not found" });
  }
  let val = jwt.verify(token, jwtSecret);
  const UserID = val.UserID;

  const { ArticleID } = req.body;
  try {
    const { data: likeData, error: likeError } = await supabase
      .from("likes")
      .select("ArticleID")
      .eq("UserID", UserID)
      .eq("ArticleID", ArticleID);

    if (likeError) {
      console.error("Error checking like:", likeError);
      return res.status(500).json({ success: false, error: "Server error" });
    }

    if (likeData.length > 0) {
      return res
        .status(400)
        .json({ success: false, error: "User already liked this article" });
    }

    const { data, error } = await supabase
      .from("likes")
      .insert([{ UserID, ArticleID }]);

    if (error != null) {
      console.error("Error like:", error);
      return res.status(500).json({ success: false, error: "Can not like" });
    }

    const { data: articleData, error: articleError } = await supabase
      .from("Articles")
      .select("TotalVote")
      .eq("ArticleID", ArticleID)
      .single();

    if (articleError) {
      console.error("Error getting article:", articleError);
      return res.status(500).json({ success: false, error: "Server error" });
    }

    const newTotalVote = articleData.TotalVote + 1;

    const { data: updateData, error: updateError } = await supabase
      .from("Articles")
      .update({ TotalVote: newTotalVote })
      .eq("ArticleID", ArticleID);

    if (updateError) {
      console.error("Cannot update:", updateError);
      return res.status(500).json({ success: false, error: "Server error" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Article liked successfully" });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

exports.getLikedArticle = async (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) {
    return res.status(300).json({ message: "Token not found" });
  }
  let val = jwt.verify(token, jwtSecret);
  const UserID = val.UserID;
  const { data, error } = await supabase
    .from("likes")
    .select("ArticleID")
    .eq("UserID", UserID);

  const IDList = [];
  for (let each of data) {
    IDList.push(each.ArticleID);
  }

  const { data: likedData, error: likedError } = await supabase
    .from("Articles")
    .select()
    .in("ArticleID", IDList);
  if (error || likedError) {
    return res.status(500).json({ success: false, error: "Server error" });
  }
  return res.status(200).json(likedData);
};

// Currently not usable
exports.chatAI = async (req, res, next) => {
  const validateErr = validationResult(req);
  if (!validateErr.isEmpty()) {
    return res.status(422).json({ validationErrors: validateErr.array() });
  }
  const { IngredientID, Style, Flavour } = req.body;
  const { data: ingredientName, error: ingreError } = await supabase
    .from("Ingredients")
    .select("IngredientName")
    .in("IngredientID", IngredientID);

  const { data: styleName, error: styleError } = await supabase
    .from("Style")
    .select("StyleName")
    .in("id", Style);

  const { data: flavourName, error: flavorError } = await supabase
    .from("Flavour")
    .select("Flavour")
    .in("FlavourID", Flavour);

  // Access your API key as an environment variable (see "Set up your API key" above)

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  let ingredientString = "";
  for (let ingredient of ingredientName) {
    ingredientString += ingredient.IngredientName + ", ";
  }
  ingredientString = ingredientString.substring(0, ingredientString.length - 2);
  let styleString = "any";
  if (styleName && styleName.length > 0) {
    styleString = "";
    for (let style of styleName) {
      styleString += style.StyleName + ", ";
    }
    styleString = styleString.substring(0, styleString.length - 2);
  }
  let flavourString = "any";
  if (flavourName && flavourName.length > 0) {
    flavourString = "";
    for (let flavour of flavourName) {
      flavourString += flavour.Flavour + ", ";
    }
    flavourString = flavourString.substring(0, flavourString.length - 2);
  }
  const prompt = `I have these ingredients: ${ingredientString}. I want to make a dish with ${styleString} style that has ${flavourString} flavour`;
  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();
  const { data, error } = await supabase
    .from("AIChat")
    .insert({ prompt: [prompt], response: [text] })
    .select();
  if (error || ingreError || flavorError || styleError) {
    return res.status(422).json({ message: "Database error" });
  }
  return res.status(200).json({ response: text, chatID: data[0].id });
};

exports.continueChat = async (req, res, next) => {
  const validateErr = validationResult(req);
  if (!validateErr.isEmpty()) {
    return res.status(422).json({ validationErrors: validateErr.array() });
  }
  const { chatID, prompt } = req.body;
  const { data, error } = await supabase
    .from("AIChat")
    .select()
    .eq("id", chatID)
    .limit(1)
    .single();
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const chatHistory = [
    {
      role: "user",
      parts: [],
    },
    {
      role: "model",
      parts: [],
    },
  ];
  for (let i in data.prompt) {
    const previousPrompt = data.prompt[i];
    const previousResponse = data.response[i];
    chatHistory[0].parts.push({ text: previousPrompt });
    chatHistory[1].parts.push({ text: previousResponse });
  }
  const chat = model.startChat({
    history: chatHistory,
    generationConfig: {
      maxOutputTokens: 10000,
    },
  });
  const result = await chat.sendMessage(prompt);
  data.prompt.push(prompt);
  data.response.push(result.response.text());
  const { error: updateErr } = await supabase
    .from("AIChat")
    .update(data)
    .eq("id", data.id);
  if (error || updateErr) {
    return res.status(422).json({ message: "Database error" });
  }
  return res
    .status(200)
    .json({ response: result.response.text(), chatID: data.id });
};
