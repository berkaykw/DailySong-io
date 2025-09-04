// app.js
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

// Routes
const indexRoutes = require('./routes/index');
const songRoutes = require('./routes/songs');
const archiveRoutes = require('./routes/archive');
const voteRoutes = require('./routes/vote');

// Cron jobs
const weeklyReset = require('./cron/weeklyReset');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: 'dailysongio-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Routes
app.use('/', indexRoutes);       // Home page
app.use('/', songRoutes);        // Add song pages
app.use('/archive', archiveRoutes); // Archive pages
app.use('/vote', voteRoutes);    // Vote for songs

// Start cron jobs
weeklyReset();

// Start server
app.listen(PORT, () => {
  console.log(`DailySong.io server running on port ${PORT}`);
});
