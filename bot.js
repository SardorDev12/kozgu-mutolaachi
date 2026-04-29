const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');
const fs = require('fs');
const http = require('http');

const { saveProgress } = require('./helpers/saveProgress');
const { daily } = require('./helpers/daily');

dotenv.config();

const TOKEN = process.env.TOKEN
const ADMIN = process.env.ADMIN

const bot = new TelegramBot(TOKEN, { polling: false });

async function startBot() {
  await bot.deleteWebHook({ drop_pending_updates: true });

  await bot.startPolling({
    params: {
      allowed_updates: ['message', 'my_chat_member'],
    },
  });

  console.log('Bot polling started');
}

startBot();

fs.mkdirSync('data', { recursive: true });

const GROUPS_FILE = 'data/groups.json';

function readGroups() {
  if (!fs.existsSync(GROUPS_FILE)) return [];
  return JSON.parse(fs.readFileSync(GROUPS_FILE, 'utf8'));
}

function saveGroups(groups) {
  fs.writeFileSync(GROUPS_FILE, JSON.stringify(groups, null, 2));
}

function addGroup(chat) {
  const groups = readGroups();

  if (!groups.find((g) => g.id === chat.id)) {
    groups.push({
      id: chat.id,
      title: chat.title || '',
      type: chat.type,
      addedAt: new Date().toISOString(),
    });

    saveGroups(groups);
    bot.sendMessage(
      ADMIN,
      `Group saved: <a href="tg://chat?id=${chat.id}">${chat.title}</a>`,
      { parse_mode: 'HTML' }
    );
    console.log('Group saved:', chat.title, chat.id);
  }
}

function removeGroup(chatId) {
  const groups = readGroups().filter((g) => g.id !== chatId);
  saveGroups(groups);
}

bot.on('my_chat_member', (update) => {
  const chat = update.chat;
  const oldStatus = update.old_chat_member.status;
  const newStatus = update.new_chat_member.status;

  if (oldStatus === 'left' && ['member', 'administrator'].includes(newStatus)) {
    addGroup(chat);
  }

  if (['left', 'kicked'].includes(newStatus)) {
    removeGroup(chat.id);
  }
});

bot.on('message', (msg) => {
  if (!msg.text && msg.chat.id != ADMIN){
    console.log("You are not an admin")
  }
  if (msg.text.startsWith('/')) return;

  try {
    if (msg.text.toLowerCase().includes('kunlikmutolaa')) {
      const quote = {
        message_id: msg.message_id,
        userID: msg.from.id,
        userName: msg.from.first_name,
        chatID: msg.chat.id,
        chatTitle: msg.chat.title,
        date: msg.date,
        text: msg.text,
      };

      saveProgress(quote);
      console.log('Progress saved');
    } else {
      console.log('No progress');
    }
  } catch (e) {
    console.log(e);
  }
});

bot.onText(/\/daily(@\w+)?/, (msg) => {
  if(msg.chat.id != ADMIN){
    console.log("You are not an admin")
  }
  const leaderboard = daily();
  broadcast(leaderboard);
});

bot.onText(/\/remind(@\w+)?/, (msg) => {
  if(msg.chat.id != ADMIN){
    console.log("You are not an admin")
  }
  broadcast('Bugun mutolaa qildingizmi?');
});

async function broadcast(text) {
  const groups = readGroups();

  for (const group of groups) {
    try {
      await bot.sendMessage(group.id, text);
      console.log('Sent to:', group.title || group.id);
    } catch (err) {
      console.error('Failed for group:', group.id, err.message);
    }
  }
}

const PORT = process.env.PORT || 8000;

http
  .createServer(async (req, res) => {
    try {
      if (req.url === '/daily') {
        const leaderboard = daily();
        await broadcast(leaderboard);

        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Daily stats sent to all groups\n');
        return;
      }

      if (req.url === '/remind') {
        await broadcast('Bugun mutolaa qildingizmi?');

        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Reminder sent to all groups\n');
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Bot is running\n');
    } catch (err) {
      console.error(err);
      res.writeHead(500);
      res.end('Server error\n');
    }
  })
  .listen(PORT, () => {
    console.log('HTTP server running on port', PORT);
  });
