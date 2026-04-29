const fs = require('fs');
const path = require('path');
const { getTodayFile } = require('./getTodayFile');

const daily = () => {
  const todayFile = getTodayFile();

  if (!fs.existsSync(todayFile)) {
    return 'Bugun hech kim mutolaa qilmadi 😔';
  }

  const messages = JSON.parse(fs.readFileSync(todayFile, 'utf8'));

  const stats = {};
  let totalPages = 0;

  for (const msg of messages) {
    const text = msg.text.trim();
    const bookMatch = text.match(/Kitob\s*:\s*([^\n]+)/i);
    const pagesMatch = text.match(/Mutolaa\s*:\s*(\d+)/i);

    if (!bookMatch || !pagesMatch) continue;

    const book = bookMatch[1].trim();
    const pages = parseInt(pagesMatch[1]);
    const user = msg.userName;

    if (!stats[user]) {
      stats[user] = {
        totalPages: 0,
        books: {},
      };
    }

    stats[user].totalPages += pages;
    totalPages += pages;

    if (!stats[user].books[book]) {
      stats[user].books[book] = 0;
    }

    stats[user].books[book] += pages;
  }

  const leaderboard = Object.entries(stats).sort(
    (a, b) => b[1].totalPages - a[1].totalPages
  );

  let result = '📚 Kunlik mutolaa yetakchilari:\n\n';

  leaderboard.forEach(([user, data], i) => {
    result += `${i + 1}. ${user} — ${data.totalPages} bet\n`;
  });

  result += `\nJami umumiy mutolaa: ${totalPages} bet`;

  const statsDir = 'stats';
  fs.mkdirSync(statsDir, { recursive: true });

  const statsFile = path.join(statsDir, path.basename(todayFile));

  fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
  return result;
};

module.exports = { daily };
