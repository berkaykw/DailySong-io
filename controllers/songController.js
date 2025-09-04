const db = require('../models/db');

exports.showAddSongPage = (req, res) => {
  res.render('add-song', { error: req.session.error || null });
  req.session.error = null;
};

exports.addSong = (req, res) => {
  const { title, artist, addedBy, spotifyUrl, youtubeUrl } = req.body;

  if (!title || !artist || !addedBy) {
    req.session.error = 'Title, artist and your name are required!';
    return res.redirect('/add-song');
  }

  db.query('SELECT * FROM weeks WHERE is_active = TRUE', (err, weekResults) => {
    if (err || weekResults.length === 0) {
      req.session.error = 'No active week found';
      return res.redirect('/add-song');
    }

    const currentWeek = weekResults[0];

    db.query('SELECT * FROM songs WHERE added_by = ? AND DATE(created_at) = CURDATE()', 
      [addedBy], (err, existingSongs) => {
      if (err) {
        req.session.error = 'Database error';
        return res.redirect('/add-song');
      }

      if (existingSongs.length > 0) {
        req.session.error = 'Bugün zaten bir şarkı eklediniz.';
        return res.redirect('/add-song');
      }

      const insertQuery = `
        INSERT INTO songs (title, artist, added_by, spotify_url, youtube_url, week_id) 
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      db.query(insertQuery, [title, artist, addedBy, spotifyUrl || null, youtubeUrl || null, currentWeek.id], 
        (err) => {
        if (err) {
          req.session.error = 'Failed to add song';
          return res.redirect('/add-song');
        }

        req.session.message = 'Şarkı Başarıyla Eklendi!';
        res.redirect('/');
      });
    });
  });
};

exports.voteSong = (req, res) => {
  const songId = req.params.songId;
  const voterIp = req.ip;
  const voterAgent = req.get('User-Agent');

  db.query('SELECT * FROM songs WHERE id = ?', [songId], (err, songResults) => {
    if (err || songResults.length === 0) {
      return res.json({ success: false, message: 'Song not found' });
    }

    const song = songResults[0];

    db.query('SELECT * FROM votes WHERE song_id = ? AND voter_ip = ?', [songId, voterIp], (err, voteResults) => {
      if (err) return res.json({ success: false, message: 'Database error' });
      if (voteResults.length > 0) return res.json({ success: false, message: 'Bu şarkıya zaten oy verdiniz!' });

      const insertVote = 'INSERT INTO votes (song_id, voter_ip, voter_agent, week_id) VALUES (?, ?, ?, ?)';
      db.query(insertVote, [songId, voterIp, voterAgent, song.week_id], (err) => {
        if (err) return res.json({ success: false, message: 'Failed to vote' });

        db.query('UPDATE songs SET votes = votes + 1 WHERE id = ?', [songId], (err) => {
          if (err) return res.json({ success: false, message: 'Failed to update vote count' });
          res.json({ success: true, message: 'Başarıyla oy verildi!' });
        });
      });
    });
  });
};
