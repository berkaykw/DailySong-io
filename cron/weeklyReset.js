// cron/weeklyReset.js
const cron = require('node-cron');
const resetWeek = require('./resetWeek');

module.exports = function () {
  // Her pazar günü 00:00'da (Türkiye saatiyle) çalışır
  cron.schedule(
    '0 0 * * 0',
    () => {
      console.log('⏰ Weekly cron job triggered (Sunday 00:00 - Europe/Istanbul)');
      resetWeek();
    },
    {
      timezone: 'Europe/Istanbul',
    }
  );
};
