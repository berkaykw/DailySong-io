const db = require('../models/db');

exports.showHomePage = (req, res) => {
  db.query('SELECT * FROM weeks WHERE is_active = TRUE', (err, weekResults) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send('Database error');
    }

    if (weekResults.length === 0) {
      return res.render('index', { songs: [], currentWeek: null, message: 'No active week found' });
    }

    const currentWeek = weekResults[0];

    const songQuery = `
      SELECT s.*, 
        (SELECT COUNT(*) FROM votes v WHERE v.song_id = s.id) as vote_count
      FROM songs s 
      WHERE s.week_id = ? 
      ORDER BY vote_count DESC, s.created_at ASC
    `;

    db.query(songQuery, [currentWeek.id], (err, songs) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).send('Database error');
      }

      res.render('index', { 
        songs, 
        currentWeek, 
        message: req.session.message || null 
      });

      req.session.message = null; // Clear message after showing
    });
  });
};
