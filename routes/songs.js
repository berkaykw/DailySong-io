const express = require('express');
const router = express.Router();
const songController = require('../controllers/songController');

// Add song page
router.get('/add-song', songController.showAddSongPage);

// Add song POST
router.post('/add-song', songController.addSong);

// Vote for song
router.post('/vote/:songId', songController.voteSong);

module.exports = router;
