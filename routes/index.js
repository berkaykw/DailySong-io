const express = require('express');
const router = express.Router();
const indexController = require('../controllers/indexController');

// Home page - show current week's songs
router.get('/', indexController.showHomePage);

module.exports = router;
