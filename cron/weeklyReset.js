const cron = require('node-cron');
const db = require('../models/db');

module.exports = function() {
  cron.schedule('0 0 * * 0', () => {
    console.log('Starting weekly reset...');

    db.query('SELECT * FROM weeks WHERE is_active = TRUE', (err, weekResults) => {
      if (err || weekResults.length === 0) {
        console.error('No active week found for reset');
        return;
      }

      const currentWeek = weekResults[0];

      db.query('UPDATE weeks SET is_active = FALSE, end_date = NOW() WHERE id = ?', [currentWeek.id], (err) => {
        if (err) return console.error('Failed to archive week:', err);

        const newWeekNumber = currentWeek.week_number + 1;
        db.query('INSERT INTO weeks (week_number, start_date, is_active) VALUES (?, NOW(), TRUE)', [newWeekNumber], (err) => {
          if (err) return console.error('Failed to create new week:', err);
          console.log(`New week ${newWeekNumber} started`);
        });
      });
    });
  });
};
