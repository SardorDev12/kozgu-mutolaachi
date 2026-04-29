const fs = require('fs');
const getTodayFile = () => {
  const today = new Date().toISOString().slice(0, 10);
  return `data/${today}.json`;
};
module.exports = { getTodayFile };
