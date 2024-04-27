const supabase = require("../utils/createClient");
const bcrypt = require("bcryptjs");

const { validationResult } = require("express-validator");

exports.example = async (req, res, next) => {
  console.log(req.body);
  const { data, error } = await supabase.from("test_table").select();
  if (error != null) {
    return res.status(500).json({
      message: "something wrong",
    });
  }
  return res.status(200).json(data);
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
