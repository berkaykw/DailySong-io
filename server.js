const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const session = require('express-session');
const cron = require('node-cron');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT;

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Session middleware
app.use(session({
  secret: 'dailysongio-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to MySQL database');
  createTables();
});

// Create tables if they don't exist
function createTables() {
  const createWeeksTable = `
    CREATE TABLE IF NOT EXISTS weeks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      week_number INT UNIQUE NOT NULL,
      start_date DATETIME NOT NULL,
      end_date DATETIME NULL,
      is_active BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createSongsTable = `
    CREATE TABLE IF NOT EXISTS songs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(100) NOT NULL,
      artist VARCHAR(100) NOT NULL,
      added_by VARCHAR(50) NOT NULL,
      spotify_url VARCHAR(500) NULL,
      youtube_url VARCHAR(500) NULL,
      week_id INT NOT NULL,
      votes INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (week_id) REFERENCES weeks(id)
    )
  `;

  const createVotesTable = `
    CREATE TABLE IF NOT EXISTS votes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      song_id INT NOT NULL,
      voter_ip VARCHAR(45) NOT NULL,
      voter_agent TEXT,
      week_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (song_id) REFERENCES songs(id),
      FOREIGN KEY (week_id) REFERENCES weeks(id),
      UNIQUE KEY unique_vote (song_id, voter_ip)
    )
  `;

  // Create weeks table
  db.query(createWeeksTable, (err) => {
    if (err) console.error('Error creating weeks table:', err);
  });

  // Create songs table
  db.query(createSongsTable, (err) => {
    if (err) console.error('Error creating songs table:', err);
  });

  // Create votes table
  db.query(createVotesTable, (err) => {
    if (err) console.error('Error creating votes table:', err);
    else initializeWeek();
  });
}

// Initialize first week if no active week exists
function initializeWeek() {
  db.query('SELECT * FROM weeks WHERE is_active = TRUE', (err, results) => {
    if (err) {
      console.error('Error checking active week:', err);
      return;
    }

    if (results.length === 0) {
      // Create first week
      const query = 'INSERT INTO weeks (week_number, start_date, is_active) VALUES (1, NOW(), TRUE)';
      db.query(query, (err) => {
        if (err) console.error('Error creating first week:', err);
        else console.log('First week initialized');
      });
    }
  });
}

// Routes

// Home page - show current week's songs
app.get('/', (req, res) => {
  // Get active week
  db.query('SELECT * FROM weeks WHERE is_active = TRUE', (err, weekResults) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send('Database error');
    }

    if (weekResults.length === 0) {
      return res.render('index', { songs: [], currentWeek: null, message: 'No active week found' });
    }

    const currentWeek = weekResults[0];

    // Get songs for current week, ordered by votes desc
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
});

// Add song page
app.get('/add-song', (req, res) => {
  res.render('add-song', { error: req.session.error || null });
  req.session.error = null;
});

// Add song POST
app.post('/add-song', (req, res) => {
  const { title, artist, addedBy, spotifyUrl, youtubeUrl } = req.body;

  if (!title || !artist || !addedBy) {
    req.session.error = 'Title, artist and your name are required!';
    return res.redirect('/add-song');
  }

  // Get active week
  db.query('SELECT * FROM weeks WHERE is_active = TRUE', (err, weekResults) => {
    if (err || weekResults.length === 0) {
      req.session.error = 'No active week found';
      return res.redirect('/add-song');
    }

    const currentWeek = weekResults[0];

    // Check if user already added a song today
    db.query('SELECT * FROM songs WHERE added_by = ? AND DATE(created_at) = CURDATE()', 
      [addedBy], (err, existingSongs) => {
      if (err) {
        req.session.error = 'Database error';
        return res.redirect('/add-song');
      }

      if (existingSongs.length > 0) {
        req.session.error = 'Bugün zaten bir şarkı eklediniz.Yarından sonra tekrar ekleyebilirsiniz...';
        return res.redirect('/add-song');
      }

      // Add the song
      const insertQuery = `
        INSERT INTO songs (title, artist, added_by, spotify_url, youtube_url, week_id) 
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      db.query(insertQuery, [title, artist, addedBy, spotifyUrl || null, youtubeUrl || null, currentWeek.id], 
        (err) => {
        if (err) {
          console.error('Error adding song:', err);
          req.session.error = 'Failed to add song';
          return res.redirect('/add-song');
        }

        req.session.message = 'Şarkı Başarıyla Eklendi!';
        res.redirect('/');
      });
    });
  });
});

// Vote for song
app.post('/vote/:songId', (req, res) => {
  const songId = req.params.songId;
  const voterIp = req.ip;
  const voterAgent = req.get('User-Agent');

  // Get song and week info
  db.query('SELECT * FROM songs WHERE id = ?', [songId], (err, songResults) => {
    if (err || songResults.length === 0) {
      return res.json({ success: false, message: 'Song not found' });
    }

    const song = songResults[0];

    // Check if already voted
    db.query('SELECT * FROM votes WHERE song_id = ? AND voter_ip = ?', 
      [songId, voterIp], (err, voteResults) => {
      if (err) {
        return res.json({ success: false, message: 'Database error' });
      }

      if (voteResults.length > 0) {
        return res.json({ success: false, message: 'Bu şarkıya zaten oy verdiniz!' });
      }

      // Add vote
      const insertVote = 'INSERT INTO votes (song_id, voter_ip, voter_agent, week_id) VALUES (?, ?, ?, ?)';
      db.query(insertVote, [songId, voterIp, voterAgent, song.week_id], (err) => {
        if (err) {
          return res.json({ success: false, message: 'Failed to vote' });
        }

        // Update vote count
        db.query('UPDATE songs SET votes = votes + 1 WHERE id = ?', [songId], (err) => {
          if (err) {
            return res.json({ success: false, message: 'Failed to update vote count' });
          }

          res.json({ success: true, message: 'Başarıyla oy verildi!' });
        });
      });
    });
  });
});

// Archive page
app.get('/archive', (req, res) => {
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
});

// Archive week detail
app.get('/archive/:weekId', (req, res) => {
  const weekId = req.params.weekId;

  // Get week info
  db.query('SELECT * FROM weeks WHERE id = ?', [weekId], (err, weekResults) => {
    if (err || weekResults.length === 0) {
      return res.status(404).send('Week not found');
    }

    const week = weekResults[0];

    // Get songs for this week
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
});

// Weekly reset cron job - runs every Sunday at 00:00
cron.schedule('0 0 * * 0', async () => {
  console.log('Starting weekly reset...');

  // Get current active week
  db.query('SELECT * FROM weeks WHERE is_active = TRUE', (err, weekResults) => {
    if (err || weekResults.length === 0) {
      console.error('No active week found for reset');
      return;
    }

    const currentWeek = weekResults[0];

    // Archive current week
    db.query('UPDATE weeks SET is_active = FALSE, end_date = NOW() WHERE id = ?', 
      [currentWeek.id], (err) => {
      if (err) {
        console.error('Failed to archive week:', err);
        return;
      }

      console.log(`Week ${currentWeek.week_number} archived`);

      // Create new week
      const newWeekNumber = currentWeek.week_number + 1;
      db.query('INSERT INTO weeks (week_number, start_date, is_active) VALUES (?, NOW(), TRUE)',
        [newWeekNumber], (err) => {
        if (err) {
          console.error('Failed to create new week:', err);
          return;
        }

        console.log(`New week ${newWeekNumber} started`);
      });
    });
  });
});

app.listen(PORT, () => {
  console.log(`DailySong.io server running on port ${PORT}`);
});