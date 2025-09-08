// resetWeek.js
const db = require('../models/db');

function resetWeekManually() {
  console.log('Starting manual weekly reset...');

  db.query('SELECT * FROM weeks WHERE is_active = TRUE', (err, weekResults) => {
    if (err || weekResults.length === 0) {
      console.error('No active week found for reset');
      return;
    }

    const currentWeek = weekResults[0];

    // mevcut haftayı kapat
    db.query(
      'UPDATE weeks SET is_active = FALSE, end_date = NOW() WHERE id = ?',
      [currentWeek.id],
      (err) => {
        if (err) {
          console.error('Failed to archive week:', err);
          return;
        }

        // yeni haftayı aç
        const newWeekNumber = currentWeek.week_number + 1;
        db.query(
          'INSERT INTO weeks (week_number, start_date, is_active) VALUES (?, NOW(), TRUE)',
          [newWeekNumber],
          (err) => {
            if (err) {
              console.error('Failed to create new week:', err);
              return;
            }
            console.log(`✅ New week ${newWeekNumber} started`);
          }
        );
      }
    );
  });
}

module.exports = resetWeekManually;
