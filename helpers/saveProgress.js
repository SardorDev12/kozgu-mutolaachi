const fs = require('fs');
const { getTodayFile } = require('./getTodayFile');

const saveProgress = (input) => {
  const todayFile = getTodayFile();
  let quotes = [];

  if (fs.existsSync(todayFile)) {
    const fileContent = fs.readFileSync(todayFile, 'utf8');

    if (fileContent.trim().length > 0) {
      quotes = JSON.parse(fileContent);
    }
  }

  quotes.push(input);

  fs.writeFileSync(todayFile, JSON.stringify(quotes, null, 2));
};

module.exports = { saveProgress };
