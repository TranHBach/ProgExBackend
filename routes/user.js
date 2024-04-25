const path = require('path');
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user');

// // /admin/add-product => GET
router.get('/info', userController.getInfo);

module.exports = router;
