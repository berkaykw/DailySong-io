const express = require('express');
const router = express.Router();
const archiveController = require('../controllers/archiveController');

// Archive page
router.get('/', archiveController.showArchive);

// Archive week detail
router.get('/:weekId', archiveController.showWeekDetail);

module.exports = router;
