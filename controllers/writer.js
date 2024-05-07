const supabase = require("../utils/createClient");
const jwt = require("jsonwebtoken");
const jwtSecret = require("../utils/jwtSecret");
const cloudinary = require("../utils/cloudinary");
const fs = require("fs");

exports.addBanking = async (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) {
    return res.status(300).json({ message: "Token not found" });
  }
  let val = jwt.verify(token, jwtSecret);
  const UserID = val.UserID;
  console.log();
  const { BankNumber, BankName, AccountHolder } = req.body;
  if (!/^\d+$/.test(BankNumber)) {
    return res
      .status(400)
      .json({ success: false, error: "BankNumber must contain only digits" });
  }
  const { data, error } = await supabase
    .from("Writers")
    .insert([{ UserID, BankNumber, BankName, AccountHolder }]);

  const { err } = await supabase
    .from("Users")
    .update({ isWriter: true })
    .eq("UserID", UserID);

  if (error) {
    console.error("Duplicate account", error);
    return res
      .status(500)
      .json({ success: false, error: "The bank account already exists" });
  }
  return res.status(200).json({ message: true });
};

// Changed again but not tested yet
exports.addArticle = async (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) {
    return res.status(300).json({ message: "Token not found" });
  }
  let val = jwt.verify(token, jwtSecret);
  const UserID = val.UserID;
  let {
    Title,
    Content,
    Description,
    Duration,
    Serving,
    Image,
    IngredientID,
    Quantity,
    Style,
    Flavour,
  } = req.body;
  Style = [0, ...Style];
  Flavour = [0, ...Flavour];
  IngredientID.sort();
  if (IngredientID.length != Quantity.length) {
    return res
      .status(422)
      .json({ message: "IngredientID must be the same length as Quantity" });
  }
  const { data, error } = await supabase.from("Articles").insert([
    {
      UserID,
      Title,
      Content,
      Duration,
      Description,
      Serving,
      Image,
      IngredientID,
      Quantity,
      Style,
      Flavour,
    },
  ]);
  if (error) {
    console.error("error", error);
    return res.status(500).json({ success: false, error: "Server error" });
  }
  return res.status(200).json({ message: true });
};

exports.uploadImage = async (req, res, next) => {
  const imageDataBuffer = req.files.image.data;
  const purpose = req.body.purpose;
  new Promise((resolve) => {
    cloudinary.uploader
      .upload_stream((error, uploadResult) => {
        return resolve(uploadResult);
      })
      .end(imageDataBuffer);
  }).then((uploadResult) => {
    if (purpose == 2) {
      const token = req.cookies.jwt;
      if (!token) {
        return res.status(300).json({ message: "Token not found" });
      }
      let val = jwt.verify(token, jwtSecret);
      const UserID = val.UserID;
      supabase
        .from("Users")
        .update({ProfileImg: uploadResult.secure_url})
        .eq("UserID", UserID)
        .then((response) => {
          if (response.error) {
              return res.status(422).json(response.error);
          }
          console.log(UserID);
          return res.status(200).json({ url: uploadResult.secure_url });
        });
    } else {
      return res.status(200).json({ url: uploadResult.secure_url });
    }
  });
};

exports.getArticleFromUserID = async (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) {
    return res.status(300).json({ message: "Token not found" });
  }
  let val = jwt.verify(token, jwtSecret);
  const UserID = val.UserID;
  try {
    const { data: articlesData, error: articlesError } = await supabase
      .from("Articles")
      .select()
      .eq("UserID", UserID);

    if (articlesError) {
      console.error("Error:", articlesError);
      return res.status(500).json({ success: false, error: "Server error" });
    }

    return res.status(200).json({ success: true, data: articlesData });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

exports.updateBankInfo = async (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) {
    return res.status(300).json({ message: "Token not found" });
  }
  let val = jwt.verify(token, jwtSecret);
  const UserID = val.UserID;
  const { BankNumber, BankName, AccountHolder } = req.body;
  const { error } = await supabase
    .from("Writers")
    .update({ BankNumber, BankName, AccountHolder })
    .eq("UserID", UserID);

  if (error) {
    return res.status(500).json({ success: false, error: "Database error" });
  }
  return res.status(200).json({ message: true });
};

exports.updateArticle = async (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) {
    return res.status(300).json({ message: "Token not found" });
  }
  let val = jwt.verify(token, jwtSecret);
  const UserID = val.UserID;
  let {
    ArticleID,
    TotalVote,
    Title,
    Content,
    Description,
    Duration,
    Serving,
    Image,
    IngredientID,
    Quantity,
    Style,
    Flavour,
  } = req.body;
  Style = [0, ...Style];
  Flavour = [0, ...Flavour];
  IngredientID.sort();
  if (IngredientID.length != Quantity.length) {
    return res
      .status(422)
      .json({ message: "IngredientID must be the same length as Quantity" });
  }
  const { data, error } = await supabase
    .from("Articles")
    .update([
      {
        ArticleID,
        Title,
        TotalVote,
        Content,
        Duration,
        Description,
        Serving,
        Image,
        IngredientID,
        Quantity,
        Style,
        Flavour,
      },
    ])
    .eq("UserID", UserID);
  if (error) {
    console.error("error", error);
    return res.status(500).json({ success: false, error: "Server error" });
  }
  return res.status(200).json({ message: true });
};

exports.getRoyalties = async (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) {
    return res.status(300).json({ message: "Token not found" });
  }
  let val = jwt.verify(token, jwtSecret);
  const UserID = val.UserID;
  const { data, err } = await supabase
    .from("WriterTransaction")
    .select()
    .eq("UserID", UserID);

  if (err) {
    return res.status(422).json({ message: "Database error" });
  }
  return res.status(200).json(data);
};
