const path = require("path");
const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const writerController = require("../controllers/writer");

// // /admin/add-product => GET

router.post(
  "/add-article",
  [
    body("Title").exists().withMessage("Title must not be empty"),
    body("Content").exists().withMessage("Content must not be empty"),
    body("Duration").exists().withMessage("Duration must not be empty"),
    body("Serving").exists().withMessage("Serving must not be empty"),
    body("Description").exists().withMessage("Description must not be empty"),
    body("IngredientID")
      .exists()
      .withMessage("Ingredient must not be empty")
      .isArray()
      .withMessage("IngredientID must be an array"),
    body("Quantity")
      .exists()
      .withMessage("Quantity must not be empty")
      .isArray()
      .withMessage("Quantity must be an array"),
    body("Style")
      .exists()
      .withMessage("Style must not be empty")
      .isArray()
      .withMessage("Style must be an array"),
    body("Flavour")
      .exists()
      .withMessage("Flavour must not be empty")
      .isArray()
      .withMessage("Flavour must be an array"),
  ],
  writerController.addArticle
);

router.post(
  "/add-writer",
  [
    body("BankNumber")
      .exists()
      .withMessage("BankNumber must not be empty")
      .isNumeric()
      .withMessage("BankNumber can only contains number"),
    body("BankName").exists().withMessage("BankName must not be empty"),
    body("AccountHolder")
      .exists()
      .withMessage("AccountHolder must not be empty"),
  ],
  writerController.addBanking
);

router.post("/upload", writerController.uploadImage);

router.post(
  "/update-bank",
  [
    body("BankNumber")
      .exists()
      .withMessage("BankNumber must not be empty")
      .isNumeric()
      .withMessage("BankNumber can only contains number"),
    body("BankName").exists().withMessage("BankName must not be empty"),
    body("AccountHolder")
      .exists()
      .withMessage("AccountHolder must not be empty"),
  ],
  writerController.updateBankInfo
);

router.post(
  "/update-article",
  [
    body("Title").exists().withMessage("Title must not be empty"),
    body("Content").exists().withMessage("Content must not be empty"),
    body("Duration").exists().withMessage("Duration must not be empty"),
    body("Serving").exists().withMessage("Serving must not be empty"),
    body("Description").exists().withMessage("Description must not be empty"),
    body("IngredientID")
      .exists()
      .withMessage("IngredientID must not be empty")
      .isArray()
      .withMessage("IngredientID must be an array"),
    body("Quantity")
      .exists()
      .withMessage("Quantity must not be empty")
      .isArray()
      .withMessage("Quantity must be an array"),
    body("Style")
      .exists()
      .withMessage("Style must not be empty")
      .isArray()
      .withMessage("Style must be an array"),
    body("Flavour")
      .exists()
      .withMessage("Flavour must not be empty")
      .isArray()
      .withMessage("Flavour must be an array"),
  ],
  writerController.updateArticle
);

router.post("/get-writer-article", writerController.getArticleFromUserID);

router.post("/get-royalties", writerController.getRoyalties);

module.exports = router;
