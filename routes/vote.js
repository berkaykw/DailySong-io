const express = require('express');
const router = express.Router();
const voteController = require('../controllers/voteController');

// Vote for song
router.post('/:songId', voteController.voteSong);

module.exports = router;
