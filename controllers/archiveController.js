const db = require('../models/db');

exports.showArchive = (req, res) => {
  const query = `
    SELECT w.*, 
      (SELECT COUNT(*) FROM songs s WHERE s.week_id = w.id) as song_count
    FROM weeks w 
    WHERE w.is_active = FALSE 
    ORDER BY w.week_number DESC
  `;

  db.query(query, (err, weeks) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send('Database error');
    }

    res.render('archive', { weeks });
  });
};

exports.showWeekDetail = (req, res) => {
  const weekId = req.params.weekId;

  db.query('SELECT * FROM weeks WHERE id = ?', [weekId], (err, weekResults) => {
    if (err || weekResults.length === 0) {
      return res.status(404).send('Week not found');
    }

    const week = weekResults[0];

    const songQuery = `
      SELECT s.*
      FROM songs s 
      WHERE s.week_id = ? 
      ORDER BY s.votes DESC, s.created_at ASC
    `;

    db.query(songQuery, [weekId], (err, songs) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).send('Database error');
      }

      res.render('week-detail', { week, songs });
    });
  });
};
