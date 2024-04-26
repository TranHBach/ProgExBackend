const path = require('path');
const express = require('express');
const router = express.Router();
const writerController = require('../controllers/writer');

// // /admin/add-product => GET
router.post('/add-article', writerController.addArticle);

router.post('/add-writer', writerController.addBanking);


module.exports = router;
