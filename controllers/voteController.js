const db = require('../models/db');

exports.voteSong = (req, res) => {
  const songId = req.params.songId;
  const voterIp = req.ip;
  const voterAgent = req.get('User-Agent');

  // Get song info
  db.query('SELECT * FROM songs WHERE id = ?', [songId], (err, songResults) => {
    if (err || songResults.length === 0) {
      return res.json({ success: false, message: 'Song not found' });
    }

    const song = songResults[0];

    // Check if already voted
    db.query('SELECT * FROM votes WHERE song_id = ? AND voter_ip = ?', [songId, voterIp], (err, voteResults) => {
      if (err) return res.json({ success: false, message: 'Database error' });
      if (voteResults.length > 0) return res.json({ success: false, message: 'Bu şarkıya zaten oy verdiniz!' });

      // Add vote
      const insertVote = 'INSERT INTO votes (song_id, voter_ip, voter_agent, week_id) VALUES (?, ?, ?, ?)';
      db.query(insertVote, [songId, voterIp, voterAgent, song.week_id], (err) => {
        if (err) return res.json({ success: false, message: 'Failed to vote' });

        // Update vote count in songs table
        db.query('UPDATE songs SET votes = votes + 1 WHERE id = ?', [songId], (err) => {
          if (err) return res.json({ success: false, message: 'Failed to update vote count' });

          res.json({ success: true, message: 'Başarıyla oy verildi!' });
        });
      });
    });
  });
};
