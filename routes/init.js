const path = require("path");
const express = require("express");
const supabase = require("../utils/createClient");
const router = express.Router();
const initController = require("../controllers/init");

router.post("/init", initController.init);

router.post("/get-everything", initController.getEverything);

router.post("/logout", initController.logout);

module.exports = router;
