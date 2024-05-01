const path = require("path");
const express = require("express");
const { body } = require("express-validator");
const supabase = require("../utils/createClient");
const router = express.Router();
const userController = require("../controllers/user");

// // /admin/add-product => GET
router.post("/example", userController.example);

router.post(
  "/register",
  [
    body("Email", "Please enter a valid email")
      .exists()
      .withMessage("Email must not be empty")
      .isEmail()
      .custom((value, { req }) => {
        const email = req.body.Email;
        return supabase
          .from("Users")
          .select()
          .eq("Email", email)
          .limit(1)
          .then((data) => {
            if (data.data.length > 0) {
              return Promise.reject("Email already exists");
            }
          });
      })
      .normalizeEmail()
      .trim(),

    body("Password")
      .exists()
      .isLength({ min: 1, max: 26 })
      .withMessage("Password must be longer than 1")
      .isAlphanumeric()
      .withMessage("Password must have both character and letter")
      .trim(),

    body("confirmPassword")
      .exists()
      .custom((value, { req }) => {
        if (value !== req.body.Password) {
          throw new Error("Password have to match");
        }
        return true;
      })
      .trim(),

    body("FirstName")
      .exists()
      .withMessage("First Name must not be empty")
      .trim(),

    body("LastName").exists().withMessage("Last Name must not be empty").trim(),

    body("Username").exists().withMessage("Username must not be empty").trim(),
  ],
  userController.register
);

router.post(
  "/login",
  [
    body("Username").exists().withMessage("Username must not be empty").trim(),
    body("Password").exists().withMessage("Password must not be empty").trim(),
  ],
  userController.login
);

router.post("/logout", userController.logout);

router.post(
  "/search-recipe",
  [
    body("ingredientList")
      .exists()
      .withMessage("ingredientList must not be empty")
      .isArray()
      .withMessage("ingredientList must be an array"),

    body("filterType")
      .exists()
      .withMessage("filterType must not be empty")
      .isNumeric()
      .withMessage("filterType must be an integer"),
  ],
  userController.searchRecipe
);

router.post(
  "/update-info",
  [
    body("Email", "Please enter a valid email")
      .exists()
      .withMessage("Email must not be empty")
      .isEmail()
      .custom((value, { req }) => {
        const email = req.body.Email;
        return supabase
          .from("Users")
          .select()
          .eq("Email", email)
          .limit(1)
          .then((data) => {
            if (data.data.length > 0) {
              return Promise.reject("Email already exists");
            }
          });
      })
      .normalizeEmail()
      .trim(),
    body("FirstName")
      .exists()
      .withMessage("First Name must not be empty")
      .trim(),

    body("LastName").exists().withMessage("Last Name must not be empty").trim(),
  ],
  userController.updateUserInfo
);

router.post(
  "/update-password",
  [
    body("oldPassword").exists().withMessage("Old password must not be empty"),
    body("newPassword").exists().withMessage("New Password must not be empty"),
    body("confirmNewPassword")
      .exists()
      .withMessage("Passwords must be matched"),
  ],
  userController.updatePassword
);

router.post(
  "/get-one-article",
  [body("ArticleID").exists().withMessage("ArticleID must not be empty")],
  userController.getOneArticle
);

module.exports = router;
